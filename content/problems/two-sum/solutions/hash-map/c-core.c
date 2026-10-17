#include <stdlib.h>
#include <stdint.h>

// 参考力扣官方的一遍哈希表算法；以开放寻址替代 uthash，适配当前运行器。
typedef struct {
    int key;
    int index;
    int used;
} Entry;

static unsigned int hashKey(int key) {
    uint32_t value = (uint32_t)key;
    value ^= value >> 16;
    value *= 0x7feb352dU;
    value ^= value >> 15;
    value *= 0x846ca68bU;
    return value ^ (value >> 16);
}

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    *returnSize = 0;
    size_t capacity = 1;
    while (capacity < (size_t)numsSize * 2) capacity <<= 1;
    Entry* table = calloc(capacity, sizeof(Entry));
    if (!table) return NULL;
    for (int i = 0; i < numsSize; ++i) {
        int complement = target - nums[i];
        size_t slot = hashKey(complement) & (capacity - 1);
        while (table[slot].used) {
            if (table[slot].key == complement) {
                int* result = malloc(2 * sizeof(int));
                if (result) {
                    result[0] = table[slot].index;
                    result[1] = i;
                    *returnSize = 2;
                }
                free(table);
                return result;
            }
            slot = (slot + 1) & (capacity - 1);
        }
        slot = hashKey(nums[i]) & (capacity - 1);
        while (table[slot].used && table[slot].key != nums[i]) {
            slot = (slot + 1) & (capacity - 1);
        }
        table[slot] = (Entry){ nums[i], i, 1 };
    }
    free(table);
    return NULL;
}
