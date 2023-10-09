import { execaCommand } from "execa";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export async function shell(command: string, options: { cwd?: string } = {}) {
  const proc = await execaCommand(command, {
    timeout: 30000,
    all: true,
    cwd: options.cwd,
    shell: true,
    reject: false,
    extendEnv: false,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      USER: process.env.USER,
      USERNAME: process.env.USERNAME,
      SHELL: process.env.SHELL,
    },
  });

  return {
    all: proc.all!,
    stdout: proc.stdout!,
    stderr: proc.stderr!,
    exitCode: proc.exitCode,
  };
}

export async function writeFile(
  filePath: string,
  contents: string
): Promise<void> {
  const dir = path.dirname(filePath);

  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(filePath, contents);
}

export async function readFile(path: string): Promise<string> {
  const contents = await fs.readFile(path, "utf-8");
  return contents;
}

export async function rm(path: string): Promise<void> {
  await fs.rm(path);
}

export async function copyFile(from: string, to: string): Promise<void> {
  await fs.copyFile(from, to);
}

export async function moveFile(from: string, to: string): Promise<void> {
  await fs.rename(from, to);
}

export async function createDirectory(path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true });
}

export function join(...paths: string[]): string {
  return path.join(...paths);
}
