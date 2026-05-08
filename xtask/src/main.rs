use std::process::Command;

type Result<T = ()> = std::result::Result<T, Box<dyn std::error::Error>>;

fn main() {
    if let Err(e) = run() {
        eprintln!("error: {e}");
        std::process::exit(1);
    }
}

fn run() -> Result {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let cmd = args.first().map(|s| s.as_str()).unwrap_or("");
    match cmd {
        "ci" => cmd_ci(),
        "build" => cmd_build(),
        "test" => cmd_test(),
        "lint" => cmd_lint(),
        "bump" => cmd_bump(args.get(1).map(|s| s.as_str()).unwrap_or("")),
        "publish" => cmd_publish(args.iter().any(|a| a == "--dry-run")),
        "release" => cmd_release(),
        _ => {
            eprintln!(
                "usage: cargo xtask <ci|build|test|lint|bump <major|minor|patch>|publish [--dry-run]|release>"
            );
            std::process::exit(1);
        }
    }
}

fn cmd_ci() -> Result {
    for (name, step) in [
        ("build", cmd_build as fn() -> Result),
        ("test", cmd_test),
        ("lint", cmd_lint),
    ] {
        println!("\n=== xtask: {name} ===");
        step()?;
    }
    println!("\n✅ All CI checks passed.");
    Ok(())
}

fn cmd_build() -> Result {
    cargo(&["build", "--workspace"])
}

fn cmd_test() -> Result {
    cargo(&["test", "--workspace"])
}

fn cmd_lint() -> Result {
    run_cmd(
        "cargo",
        &["+stable", "clippy", "--workspace", "--", "-D", "warnings"],
    )?;
    run_cmd("cargo", &["+stable", "fmt", "--all", "--check"])
}

fn cmd_bump(level: &str) -> Result {
    if !matches!(level, "major" | "minor" | "patch") {
        return Err("usage: cargo xtask bump <major|minor|patch>".into());
    }
    let root = project_root();
    let current = read_version(&root)?;
    let next = bump_version(&current, level)?;
    println!("  → bumping {current} → {next}");
    for toml in find_cargo_tomls(&root) {
        if rewrite_version(&toml, &next)? {
            println!("  → updated {toml}");
        }
    }
    println!("  ✅ version bumped to {next}");
    Ok(())
}

fn cmd_publish(dry_run: bool) -> Result {
    let crates = [
        "xrune-sigil",
        "xrune-nexus",
        "xrune-incant",
        "xrune",
        "xrune-fmt",
    ];
    let verb = if dry_run { "Packaging" } else { "Publishing" };
    println!("  → {verb} {} crates", crates.len());

    for (i, name) in crates.iter().enumerate() {
        println!("\n  [{}/{}] {verb} {name}", i + 1, crates.len());
        let mut args = vec!["publish", "-p", name, "--no-verify"];
        if dry_run {
            args.push("--dry-run");
        }
        cargo(&args)?;
        if !dry_run && i + 1 < crates.len() {
            println!("  → waiting 30s for crates.io index...");
            std::thread::sleep(std::time::Duration::from_secs(30));
        }
    }

    println!(
        "\n  ✅ {}",
        if dry_run {
            "dry-run complete"
        } else {
            "all crates published"
        }
    );
    Ok(())
}

fn cmd_release() -> Result {
    let root = project_root();
    let output = Command::new("git")
        .args(["status", "--porcelain"])
        .current_dir(&root)
        .output()?;
    if !output.stdout.is_empty() {
        return Err("working tree not clean".into());
    }

    let version = read_version(&root)?;
    let tag = format!("v{version}");
    println!("  → releasing {tag}");

    run_cmd("git", &["push", "origin", "main"])?;

    println!("  → waiting for CI...");
    wait_for_ci(&root)?;

    run_cmd("git", &["tag", &tag])?;
    run_cmd("git", &["push", "origin", &tag])?;

    println!("  → creating GitHub release...");
    let _ = Command::new("gh")
        .args([
            "release",
            "create",
            &tag,
            "--title",
            &tag,
            "--generate-notes",
        ])
        .current_dir(&root)
        .status();

    println!("  → publishing to crates.io...");
    cmd_publish(false)?;

    println!("\n  🎉 released {tag}!");
    Ok(())
}

fn wait_for_ci(root: &str) -> Result {
    let head = Command::new("git")
        .args(["rev-parse", "HEAD"])
        .current_dir(root)
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_default();

    let timeout = std::time::Duration::from_secs(10 * 60);
    let start = std::time::Instant::now();

    loop {
        std::thread::sleep(std::time::Duration::from_secs(15));
        let output = Command::new("gh")
            .args([
                "run",
                "list",
                "--workflow",
                "ci.yml",
                "--limit",
                "5",
                "--json",
                "status,conclusion,headSha",
                "-q",
                &format!(".[] | select(.headSha == \"{head}\") | [.status, .conclusion] | @tsv"),
            ])
            .current_dir(root)
            .output()?;
        let out = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if let Some(first) = out.lines().next() {
            let parts: Vec<&str> = first.split('\t').collect();
            let status = parts.first().copied().unwrap_or("");
            let conclusion = parts.get(1).copied().unwrap_or("");
            if status == "completed" {
                if conclusion == "success" {
                    println!("  ✅ CI passed");
                    return Ok(());
                } else {
                    return Err(format!("CI failed: {conclusion}").into());
                }
            }
            println!("    CI: {status}...");
        }
        if start.elapsed() > timeout {
            return Err("CI timeout (10 min)".into());
        }
    }
}

// --- helpers ---

fn project_root() -> String {
    std::env::var("CARGO_MANIFEST_DIR")
        .map(|d| {
            std::path::Path::new(&d)
                .parent()
                .unwrap()
                .to_string_lossy()
                .to_string()
        })
        .unwrap_or_else(|_| ".".to_string())
}

fn cargo(args: &[&str]) -> Result {
    run_cmd("cargo", args)
}

fn run_cmd(cmd: &str, args: &[&str]) -> Result {
    println!("  → {cmd} {}", args.join(" "));
    let status = Command::new(cmd)
        .args(args)
        .current_dir(project_root())
        .status()
        .map_err(|e| format!("failed to run {cmd}: {e}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("{cmd} {} failed", args.join(" ")).into())
    }
}

fn read_version(root: &str) -> Result<String> {
    let content = std::fs::read_to_string(format!("{root}/Cargo.toml"))?;
    if let Some(v) = content
        .lines()
        .find(|l| l.trim().starts_with("version =") && !l.contains("workspace"))
        .and_then(|l| l.split('"').nth(1))
    {
        return Ok(v.to_string());
    }
    for toml in find_cargo_tomls(root) {
        if let Ok(c) = std::fs::read_to_string(&toml)
            && let Some(v) = c
                .lines()
                .find(|l| l.trim().starts_with("version =") && !l.contains("workspace"))
                .and_then(|l| l.split('"').nth(1))
        {
            return Ok(v.to_string());
        }
    }
    Err("could not find version".into())
}

fn find_cargo_tomls(root: &str) -> Vec<String> {
    let mut result = Vec::new();
    fn walk(dir: &std::path::Path, result: &mut Vec<String>) {
        let Ok(entries) = std::fs::read_dir(dir) else {
            return;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let name = path.file_name().unwrap_or_default().to_string_lossy();
                if name != "target" && name != "node_modules" && name != ".git" {
                    walk(&path, result);
                }
            } else if path.file_name().is_some_and(|f| f == "Cargo.toml") {
                result.push(path.to_string_lossy().into_owned());
            }
        }
    }
    walk(std::path::Path::new(root), &mut result);
    result.sort();
    result
}

fn rewrite_version(path: &str, next: &str) -> Result<bool> {
    let content = std::fs::read_to_string(path)?;
    let mut in_package = false;
    let mut in_workspace_deps = false;
    let updated: String = content
        .lines()
        .map(|line| {
            let trimmed = line.trim();
            if trimmed == "[package]" || trimmed == "[workspace.package]" {
                in_package = true;
                in_workspace_deps = false;
            } else if trimmed == "[workspace.dependencies]" {
                in_package = false;
                in_workspace_deps = true;
            } else if trimmed.starts_with('[') {
                in_package = false;
                in_workspace_deps = false;
            }
            if in_package && trimmed.starts_with("version =") && !trimmed.contains("workspace") {
                replace_semver(line, next)
            } else if in_workspace_deps && trimmed.contains("version =") {
                replace_version_field(line, &format!("={next}"))
            } else {
                line.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
        + "\n";
    if updated == content {
        return Ok(false);
    }
    std::fs::write(path, updated)?;
    Ok(true)
}

fn replace_semver(line: &str, next: &str) -> String {
    if let Some(start) = line.find('"')
        && let Some(end) = line[start + 1..].find('"')
    {
        let before = &line[..start];
        let after = &line[start + 1 + end + 1..];
        return format!("{before}\"{next}\"{after}");
    }
    line.to_string()
}

fn replace_version_field(line: &str, next: &str) -> String {
    // Find `version = "..."` and replace only that quoted value
    if let Some(ver_pos) = line.find("version =") {
        let after_ver = &line[ver_pos..];
        if let Some(q1) = after_ver.find('"') {
            if let Some(q2) = after_ver[q1 + 1..].find('"') {
                let abs_q1 = ver_pos + q1;
                let abs_q2 = ver_pos + q1 + 1 + q2;
                let before = &line[..abs_q1];
                let after = &line[abs_q2 + 1..];
                return format!("{before}\"{next}\"{after}");
            }
        }
    }
    line.to_string()
}
fn bump_version(version: &str, level: &str) -> Result<String> {
    let parts: Vec<u64> = version
        .split('.')
        .map(|p| p.parse::<u64>().map_err(|e| format!("bad version: {e}")))
        .collect::<std::result::Result<_, _>>()?;
    if parts.len() != 3 {
        return Err(format!("expected x.y.z, got {version}").into());
    }
    let (major, minor, patch) = (parts[0], parts[1], parts[2]);
    Ok(match level {
        "major" => format!("{}.0.0", major + 1),
        "minor" => format!("{major}.{}.0", minor + 1),
        "patch" => format!("{major}.{minor}.{}", patch + 1),
        _ => unreachable!(),
    })
}
