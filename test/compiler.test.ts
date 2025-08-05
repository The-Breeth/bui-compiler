import { compile, render } from '../src';
import * as path from 'path';
import { promises as fs } from 'fs';

describe('Breeth BUI Compiler', () => {
  it('parses single-file example without errors', async () => {
    const filePath = path.join(__dirname, '..', 'example', 'example.bui');
    const content = await fs.readFile(filePath, 'utf-8');
    const result = await compile({ 'example.bui': content });
    expect(result.errors).toHaveLength(0);
    expect(result.ast.profile.name).toBe('SoundAI Labs');
    expect(result.ast.bPods.length).toBe(1);
  });

  it('parses folder example without errors', async () => {
    const folderPath = path.join(__dirname, '..', 'example', 'soundai-folder');
    const files = await fs.readdir(folderPath);
    const map: Record<string, string> = {};
    for (const f of files) {
      map[f] = await fs.readFile(path.join(folderPath, f), 'utf-8');
    }
    const result = await compile(map);
    expect(result.errors).toHaveLength(0);
    expect(result.ast.bPods.length).toBe(2);
    expect(result.ast.profile.contact).toBe('support@soundai.com');
  });

  it('renders html output', async () => {
    const filePath = path.join(__dirname, '..', 'example', 'example.bui');
    const content = await fs.readFile(filePath, 'utf-8');
    const html = await render({ 'example.bui': content });
    expect(html).toContain('<h1>SoundAI Labs</h1>');
  });
});
