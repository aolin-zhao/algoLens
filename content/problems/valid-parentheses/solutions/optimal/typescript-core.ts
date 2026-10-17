function isValid(s: string): boolean {
  const stack = [];
  const pairs: Record<string, string> = {'(': ')', '[': ']', '{': '}'};
  for (const char of s) {
    if (pairs[char]) stack.push(pairs[char]);
    else if (stack.pop() !== char) return false;
  }
  return stack.length === 0;
}
