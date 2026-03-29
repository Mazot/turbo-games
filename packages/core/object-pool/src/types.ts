/** Interface for objects that can be pooled and reset for reuse */
export interface Poolable {
  /** Called when the object is returned to the pool. Reset internal state here. */
  reset(): void;
}
