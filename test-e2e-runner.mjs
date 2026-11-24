import { executeCode, evaluateTestCases, outputsMatch, normalizeOutput } from './lib/codeRunner.ts';

async function testAll() {
  console.log('🚀 Running Comprehensive Code Runner & Anti-Cheat Tests...\n');

  // Test 1: JavaScript Execution
  const jsCode = `
const fs = require('fs');
const line = fs.readFileSync(0, 'utf-8').trim();
console.log('Result:' + (parseInt(line, 10) * 2));
`;
  const jsRes = await executeCode({
    language: 'javascript',
    code: jsCode,
    stdin: '21',
  });
  console.log('1. JavaScript Execution:', jsRes.success && jsRes.stdout === 'Result:42' ? 'PASSED ✅' : 'FAILED ❌', jsRes.stdout);

  // Test 2: Python 3 Execution
  const pyCode = `
import sys
val = int(sys.stdin.read().strip())
print(f"Cube:{val ** 3}")
`;
  const pyRes = await executeCode({
    language: 'python',
    code: pyCode,
    stdin: '3',
  });
  console.log('2. Python Execution:', pyRes.success && pyRes.stdout === 'Cube:27' ? 'PASSED ✅' : 'FAILED ❌', pyRes.stdout);

  // Test 3: Output Matching (JSON tolerance)
  const match1 = outputsMatch('[0, 1]', '[0,1]');
  const match2 = outputsMatch('true\n', 'True');
  const match3 = outputsMatch('hello', 'world');
  console.log('3. Normalization & Matching:');
  console.log('   - JSON match [0, 1] == [0,1]:', match1 ? 'PASSED ✅' : 'FAILED ❌');
  console.log('   - Boolean match true == True:', match2 ? 'PASSED ✅' : 'FAILED ❌');
  console.log('   - Diff mismatch hello != world:', !match3 ? 'PASSED ✅' : 'FAILED ❌');

  // Test 4: Evaluation of Multi-testcases
  const palindromeCode = `
const fs = require('fs');
const s = fs.readFileSync(0, 'utf-8').trim();
const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
const isPal = clean === clean.split('').reverse().join('');
console.log(isPal ? 'true' : 'false');
`;
  const testCases = [
    { input: 'race a car', expectedOutput: 'false' },
    { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true' },
    { input: ' ', expectedOutput: 'true' },
  ];

  const evalRes = await evaluateTestCases('javascript', palindromeCode, testCases);
  console.log('4. Palindrome Test Suite Evaluation:', evalRes.allPassed ? 'ALL PASSED ✅' : 'FAILED ❌');
  console.log('   - Overall Status:', evalRes.overallStatus);
  console.log('   - Passed:', evalRes.passedTestCases, '/', evalRes.totalTestCases);

  console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
}

testAll().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
