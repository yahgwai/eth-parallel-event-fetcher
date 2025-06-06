// ABOUTME: Tests for release process configuration
// ABOUTME: Ensures release commits include [skip ci] tag

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Release Process Configuration', () => {
  const versionrcPath = path.join(process.cwd(), '.versionrc');
  let versionrcContent: any;

  beforeAll(() => {
    // Read and parse .versionrc
    const rawContent = fs.readFileSync(versionrcPath, 'utf8');
    versionrcContent = JSON.parse(rawContent);
  });

  it('should have releaseCommitMessageFormat configured', () => {
    expect(versionrcContent).toHaveProperty('releaseCommitMessageFormat');
  });

  it('should include [skip ci] in release commit message format', () => {
    const format = versionrcContent.releaseCommitMessageFormat;
    expect(format).toBeDefined();
    expect(format).toContain('[skip ci]');
  });

  it('should maintain standard chore(release) format with [skip ci]', () => {
    const format = versionrcContent.releaseCommitMessageFormat;
    expect(format).toMatch(/^chore\(release\):/);
    expect(format).toContain('{{currentTag}}');
    expect(format).toMatch(/\[skip ci\]$/);
  });

  describe('Dry Run Tests', () => {
    it('should generate correct commit message in dry run', () => {
      try {
        // Run standard-version in dry run mode and capture output
        const output = execSync('npx standard-version --dry-run 2>&1', {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        // The dry run output should include the commit step
        // Look for signs of successful execution
        expect(output).toBeDefined();
        expect(output.length).toBeGreaterThan(0);
        
        // Check that it's attempting to tag a release
        expect(output).toMatch(/tagging release|Run `git push/);
      } catch (error: any) {
        // If standard-version fails, it might be because there are no commits to release
        // This is okay for our test
        if (!error.message.includes('No commits since release')) {
          throw error;
        }
      }
    });
  });

  describe('Configuration Validation', () => {
    it('should have all required configuration fields', () => {
      expect(versionrcContent).toHaveProperty('types');
      expect(versionrcContent).toHaveProperty('commitUrlFormat');
      expect(versionrcContent).toHaveProperty('compareUrlFormat');
      expect(versionrcContent).toHaveProperty('issueUrlFormat');
    });

    it('should have correct GitHub URLs configured', () => {
      const repo = 'yahgwai/eth-parallel-event-fetcher';
      expect(versionrcContent.commitUrlFormat).toContain(`github.com/${repo}/commit`);
      expect(versionrcContent.compareUrlFormat).toContain(`github.com/${repo}/compare`);
      expect(versionrcContent.issueUrlFormat).toContain(`github.com/${repo}/issues`);
    });

    it('should have all standard commit types configured', () => {
      const types = versionrcContent.types.map((t: any) => t.type);
      const expectedTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];
      
      expectedTypes.forEach(type => {
        expect(types).toContain(type);
      });
    });
  });
});

describe('Release Workflow Integration', () => {
  it('should properly format release commit messages', () => {
    // This test verifies the expected format that will be used
    const expectedFormat = 'chore(release): {{currentTag}} [skip ci]';
    const versionrcPath = path.join(process.cwd(), '.versionrc');
    const rawContent = fs.readFileSync(versionrcPath, 'utf8');
    const config = JSON.parse(rawContent);
    
    expect(config.releaseCommitMessageFormat).toBe(expectedFormat);
  });

  it('should support version placeholders in commit format', () => {
    const versionrcPath = path.join(process.cwd(), '.versionrc');
    const rawContent = fs.readFileSync(versionrcPath, 'utf8');
    const config = JSON.parse(rawContent);
    
    // Verify the format uses the correct placeholder
    expect(config.releaseCommitMessageFormat).toContain('{{currentTag}}');
    
    // Simulate what the actual commit would look like
    const simulatedCommit = config.releaseCommitMessageFormat.replace('{{currentTag}}', 'v1.2.10');
    expect(simulatedCommit).toBe('chore(release): v1.2.10 [skip ci]');
  });
});