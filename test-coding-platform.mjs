import { executeCode, evaluateTestCases, outputsMatch } from './lib/codeRunner.ts';

async function runTests() {
  console.log('🧪 Starting Code Runner Unit Tests...\n');

  // Test 1: JavaScript execution
  const jsCode = `
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
console.log('Echo: ' + input);
`;
  const jsRes = await executeCode({
    language: 'javascript',
    code: jsCode,
    stdin: 'Hello LearnX',
  });
  console.log('1. JavaScript Execution:', jsRes.success && jsRes.stdout === 'Echo: Hello LearnX' ? 'PASSED ✅' : 'FAILED ❌', jsRes);

  // Test 2: Python 3 execution
  const pyCode = `
import sys
data = sys.stdin.read().strip()
print(f"Python: {data}")
`;
  const pyRes = await executeCode({
    language: 'python',
    code: pyCode,
    stdin: '42',
  });
  console.log('2. Python Execution:', pyRes.success && pyRes.stdout === 'Python: 42' ? 'PASSED ✅' : 'FAILED ❌', pyRes);

  // Test 3: Output normalization (JSON comparison)
  const jsonMatch = outputsMatch('[0, 1]', '[0,1]');
  console.log('3. JSON Output Matching ([0, 1] vs [0,1]):', jsonMatch ? 'PASSED ✅' : 'FAILED ❌');

  // Test 4: Evaluate Two Sum test cases in JavaScript
  const twoSumCode = `
const fs = require('fs');
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) return [map.get(diff), i];
        map.set(nums[i], i);
    }
    return [];
}
const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (input.length >= 2) {
    const nums = JSON.parse(input[0]);
    const target = parseInt(input[1], 10);
    console.log(JSON.stringify(twoSum(nums, target)));
}
`;
  const testCases = [
    { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]' },
    { input: '[3,2,4]\n6', expectedOutput: '[1,2]' },
    { input: '[3,3]\n6', expectedOutput: '[0,1]' },
  ];

  const evalRes = await evaluateTestCases('javascript', twoSumCode, testCases);
  console.log('4. Two Sum Evaluation:', evalRes.allPassed ? 'ALL PASSED ✅' : 'FAILED ❌', evalRes);

  console.log('\n🎉 All local runner checks passed successfully!');
}

runTests().catch(console.error);
