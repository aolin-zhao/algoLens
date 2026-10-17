function isValid(s) {
  const stack = [];
  const pairs = {'(': ')', '[': ']', '{': '}'};
  for (const char of s) {
    if (pairs[char]) stack.push(pairs[char]);
    else if (stack.pop() !== char) return false;
  }
  return stack.length === 0;
}
