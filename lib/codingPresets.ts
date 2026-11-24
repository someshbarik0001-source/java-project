export interface CodingProblemPreset {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  description: string;
  starterCode: {
    javascript: string;
    python: string;
    java: string;
  };
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
    explanation?: string;
  }>;
}

export const CODING_PROBLEM_PRESETS: CodingProblemPreset[] = [
  {
    id: 'two-sum',
    title: '1. Two Sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    description: `### Problem Statement
Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly one solution***, and you may not use the *same* element twice.

You can return the answer in any order.

---
### Example 1:
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

### Example 2:
\`\`\`
Input: nums = [3,2,4], target = 6
Output: [1,2]
\`\`\`

### Example 3:
\`\`\`
Input: nums = [3,3], target = 6
Output: [0,1]
\`\`\`

---
### Constraints:
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- **Only one valid answer exists.**
`,
    starterCode: {
      javascript: `// JavaScript Solution for Two Sum
const fs = require('fs');

function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff), i];
        }
        map.set(nums[i], i);
    }
    return [];
}

// I/O Driver
const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (input.length >= 2) {
    const nums = JSON.parse(input[0]);
    const target = parseInt(input[1], 10);
    console.log(JSON.stringify(twoSum(nums, target)));
}
`,
      python: `# Python 3 Solution for Two Sum
import sys
import json

def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

if __name__ == "__main__":
    lines = sys.stdin.read().strip().split("\\n")
    if len(lines) >= 2:
        nums = json.loads(lines[0])
        target = int(lines[1])
        print(json.dumps(two_sum(nums, target)))
`,
      java: `// Java Solution for Two Sum
import java.util.*;

public class Solution {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String line1 = sc.nextLine().trim();
        if (!sc.hasNextLine()) return;
        int target = Integer.parseInt(sc.nextLine().trim());

        line1 = line1.replace("[", "").replace("]", "");
        String[] parts = line1.split(",");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            nums[i] = Integer.parseInt(parts[i].trim());
        }

        int[] res = twoSum(nums, target);
        System.out.println("[" + res[0] + "," + res[1] + "]");
    }
}
`,
    },
    testCases: [
      {
        input: '[2,7,11,15]\n9',
        expectedOutput: '[0,1]',
        isHidden: false,
        explanation: 'nums[0] + nums[1] = 2 + 7 = 9',
      },
      {
        input: '[3,2,4]\n6',
        expectedOutput: '[1,2]',
        isHidden: false,
        explanation: 'nums[1] + nums[2] = 2 + 4 = 6',
      },
      {
        input: '[3,3]\n6',
        expectedOutput: '[0,1]',
        isHidden: false,
        explanation: 'nums[0] + nums[1] = 3 + 3 = 6',
      },
      {
        input: '[1,5,8,12,19]\n20',
        expectedOutput: '[0,4]',
        isHidden: true,
        explanation: 'Hidden evaluation test case',
      },
      {
        input: '[-3,4,3,90]\n0',
        expectedOutput: '[0,2]',
        isHidden: true,
        explanation: 'Hidden evaluation test case with negative integers',
      },
    ],
  },
  {
    id: 'valid-palindrome',
    title: '125. Valid Palindrome',
    difficulty: 'Easy',
    tags: ['Two Pointers', 'String'],
    description: `### Problem Statement
A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` *if it is a palindrome, or* \`false\` *otherwise*.

---
### Example 1:
\`\`\`
Input: s = "A man, a plan, a canal: Panama"
Output: true
Explanation: "amanaplanacanalpanama" is a palindrome.
\`\`\`

### Example 2:
\`\`\`
Input: s = "race a car"
Output: false
Explanation: "raceacar" is not a palindrome.
\`\`\`

### Example 3:
\`\`\`
Input: s = " "
Output: true
Explanation: s is an empty string "" after removing non-alphanumeric characters.
Since an empty string reads the same forward and backward, it is a palindrome.
\`\`\`

---
### Constraints:
- \`1 <= s.length <= 2 * 10^5\`
- \`s\` consists only of printable ASCII characters.
`,
    starterCode: {
      javascript: `const fs = require('fs');

function isPalindrome(s) {
    const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    let left = 0, right = cleaned.length - 1;
    while (left < right) {
        if (cleaned[left] !== cleaned[right]) return false;
        left++;
        right--;
    }
    return true;
}

const input = fs.readFileSync(0, 'utf-8');
console.log(isPalindrome(input));
`,
      python: `import sys

def is_palindrome(s):
    cleaned = [c.lower() for c in s if c.isalnum()]
    return cleaned == cleaned[::-1]

if __name__ == "__main__":
    text = sys.stdin.read()
    print("true" if is_palindrome(text) else "false")
`,
      java: `import java.util.*;

public class Solution {
    public static boolean isPalindrome(String s) {
        StringBuilder sb = new StringBuilder();
        for (char c : s.toCharArray()) {
            if (Character.isLetterOrDigit(c)) {
                sb.append(Character.toLowerCase(c));
            }
        }
        String clean = sb.toString();
        int l = 0, r = clean.length() - 1;
        while (l < r) {
            if (clean.charAt(l++) != clean.charAt(r--)) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        StringBuilder full = new StringBuilder();
        while (sc.hasNextLine()) {
            full.append(sc.nextLine());
        }
        System.out.println(isPalindrome(full.toString()));
    }
}
`,
    },
    testCases: [
      {
        input: 'A man, a plan, a canal: Panama',
        expectedOutput: 'true',
        isHidden: false,
      },
      {
        input: 'race a car',
        expectedOutput: 'false',
        isHidden: false,
      },
      {
        input: ' ',
        expectedOutput: 'true',
        isHidden: false,
      },
      {
        input: 'Was it a car or a cat I saw?',
        expectedOutput: 'true',
        isHidden: true,
      },
      {
        input: '0P',
        expectedOutput: 'false',
        isHidden: true,
      },
    ],
  },
  {
    id: 'reverse-string',
    title: '344. Reverse String',
    difficulty: 'Easy',
    tags: ['Two Pointers', 'String'],
    description: `### Problem Statement
Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array **in-place** with \`O(1)\` extra memory.

---
### Example 1:
\`\`\`
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]
\`\`\`

### Example 2:
\`\`\`
Input: s = ["H","a","n","n","a","h"]
Output: ["h","a","n","n","a","H"]
\`\`\`

---
### Constraints:
- \`1 <= s.length <= 10^5\`
- \`s[i]\` is a printable ascii character.
`,
    starterCode: {
      javascript: `const fs = require('fs');

function reverseString(s) {
    let left = 0, right = s.length - 1;
    while (left < right) {
        const temp = s[left];
        s[left] = s[right];
        s[right] = temp;
        left++;
        right--;
    }
    return s;
}

const input = fs.readFileSync(0, 'utf-8').trim();
try {
    const arr = JSON.parse(input);
    console.log(JSON.stringify(reverseString(arr)));
} catch (e) {
    console.log(JSON.stringify(input.split('').reverse()));
}
`,
      python: `import sys
import json

def reverse_string(s):
    s.reverse()
    return s

if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    try:
        arr = json.loads(raw)
        print(json.dumps(reverse_string(arr)))
    except:
        print(json.dumps(list(reversed(raw))))
`,
      java: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String line = sc.nextLine().trim();
        line = line.replace("[", "").replace("]", "").replace("\"", "");
        String[] parts = line.split(",");
        List<String> list = new ArrayList<>();
        for (String p : parts) list.add(p.trim());
        Collections.reverse(list);
        System.out.println("[\"" + String.join("\",\"", list) + "\"]");
    }
}
`,
    },
    testCases: [
      {
        input: '["h","e","l","l","o"]',
        expectedOutput: '["o","l","l","e","h"]',
        isHidden: false,
      },
      {
        input: '["H","a","n","n","a","h"]',
        expectedOutput: '["h","a","n","n","a","H"]',
        isHidden: false,
      },
      {
        input: '["a"]',
        expectedOutput: '["a"]',
        isHidden: true,
      },
    ],
  },
  {
    id: 'binary-search',
    title: '704. Binary Search',
    difficulty: 'Easy',
    tags: ['Array', 'Binary Search'],
    description: `### Problem Statement
Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.

---
### Example 1:
\`\`\`
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4
Explanation: 9 exists in nums and its index is 4
\`\`\`

### Example 2:
\`\`\`
Input: nums = [-1,0,3,5,9,12], target = 2
Output: -1
Explanation: 2 does not exist in nums so return -1
\`\`\`
`,
    starterCode: {
      javascript: `const fs = require('fs');

function search(nums, target) {
    let low = 0, high = nums.length - 1;
    while (low <= high) {
        const mid = Math.floor(low + (high - low) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (input.length >= 2) {
    const nums = JSON.parse(input[0]);
    const target = parseInt(input[1], 10);
    console.log(search(nums, target));
}
`,
      python: `import sys
import json

def binary_search(nums, target):
    low, high = 0, len(nums) - 1
    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

if __name__ == "__main__":
    lines = sys.stdin.read().strip().split("\\n")
    if len(lines) >= 2:
        nums = json.loads(lines[0])
        target = int(lines[1])
        print(binary_search(nums, target))
`,
      java: `import java.util.*;

public class Solution {
    public static int search(int[] nums, int target) {
        int low = 0, high = nums.length - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) low = mid + 1;
            else high = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String line1 = sc.nextLine().trim().replace("[", "").replace("]", "");
        if (!sc.hasNextLine()) return;
        int target = Integer.parseInt(sc.nextLine().trim());
        String[] parts = line1.split(",");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i].trim());
        System.out.println(search(nums, target));
    }
}
`,
    },
    testCases: [
      {
        input: '[-1,0,3,5,9,12]\n9',
        expectedOutput: '4',
        isHidden: false,
      },
      {
        input: '[-1,0,3,5,9,12]\n2',
        expectedOutput: '-1',
        isHidden: false,
      },
      {
        input: '[5]\n5',
        expectedOutput: '0',
        isHidden: true,
      },
      {
        input: '[2,5]\n0',
        expectedOutput: '-1',
        isHidden: true,
      },
    ],
  },
];
