export interface SelectOpt {
  value: string;
  label: string;
}

/** Puts "not specified" first, so an optional field can be cleared after it
 * has been chosen. Its value is the empty string, which validation reads as
 * "no answer". */
export function withUnspecified(label: string, options: SelectOpt[]): SelectOpt[] {
  return [{ value: "", label }, ...options];
}

/** Same, but only when the field is optional: a required one must not offer
 * a way to leave it empty. */
export function optionalUnless(required: boolean, label: string, options: SelectOpt[]): SelectOpt[] {
  return required ? options : withUnspecified(label, options);
}
