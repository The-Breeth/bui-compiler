import { compileBui } from '../src';
import * as path from 'path';

describe('Breeth BUI Compiler', () => {
  it('parses single-file example without errors', async () => {
    const filePath = path.join(__dirname, '..', 'example', 'example.bui');
    const result = await compileBui(filePath, 'single');
    expect(result.errors).toHaveLength(0);
    expect(result.parsed?.profile.name).toBe('SoundAI Labs');
    expect(result.parsed?.bPods.length).toBe(1);
  });

  it('parses folder example without errors', async () => {
    const folderPath = path.join(__dirname, '..', 'example', 'soundai-folder');
    const result = await compileBui(folderPath, 'folder');
    expect(result.errors).toHaveLength(0);
    expect(result.parsed?.bPods.length).toBe(2);
    expect(result.parsed?.profile.contact).toBe('support@soundai.com');
  });
});
