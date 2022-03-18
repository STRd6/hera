/**
 * Location information within a string. A position and a length. Can be
 * converted into line numbers when reporting errors.
 */
export interface Loc {
  pos: number
  length: number
}

/**
 * The current parse state. The input string being parsed and the position to
 * check for matches.
 */
export interface ParseState {
  input: string
  pos: number
}

/**
 * A parsing result. We found a `T` at `loc` and the next position to parse is
 * `pos`.
 *
 * Is pos always loc.pos + loc.length?
 */
export interface ParseResult<T> {
  loc: Loc,
  pos: number,
  value: T,
}

/**
 * Either we found a parse result or we didn't.
 */
export type MaybeResult<T> = ParseResult<T> | undefined

/**
 * Utility to get the wrapped ParseResult type.
 */
export type Unwrap<T extends MaybeResult<any>> = T extends undefined ? never : T extends ParseResult<infer P> ? P : any;

/**
 * Note failure to find `expectation` at `pos`. This is later used to generate
 * detailed error messages.
 */
interface Fail {
  (pos: number, expectation: any): void
}

/**
 * A Parser is a function that takes a string and position to check and returns
 * a result if it matches.
 */
export interface Parser<T> {
  (state: ParseState): MaybeResult<T>
}

/**
 * Match a string literal.
 */
export function $L<T extends string>(state: ParseState, str: T, fail: Fail): MaybeResult<T> {
  const { input, pos } = state;
  const { length } = str;

  if (input.substr(pos, length) === str) {
    return {
      loc: {
        pos: pos,
        length: length
      },
      pos: pos + length,
      value: str
    }
  }

  fail(pos, str)
}

/**
 * Match a regular expression (must be sticky).
 */
export function $R(state: ParseState, regExp: RegExp, fail: Fail): MaybeResult<RegExpMatchArray> {
  const { input, pos } = state
  regExp.lastIndex = state.pos

  let l, m, v

  if (m = input.match(regExp)) {
    v = m[0]
    l = v.length

    return {
      loc: {
        pos: pos,
        length: l,
      },
      pos: pos + l,
      value: m,
    }
  }

  fail(pos, regExp)
}

// a / b / c / ...
// Proioritized choice
// roughly a(...) || b(...) in JS, generalized to reduce, optimized to loop

// export function $C<A>(a: Parser<A>): Parser<A>
// export function $C<A, B>(a: Parser<A>, b: Parser<B>): Parser<A | B>
// export function $C<A, B, C>(a: Parser<A>, b: Parser<B>, c: Parser<C>): Parser<A | B | C>
// export function $C<A, B, C, D>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>): Parser<A | B | C | D>
// export function $C<A, B, C, D, E>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>): Parser<A | B | C | D | E>
// export function $C<A, B, C, D, E, F>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>): Parser<A | B | C | D | E | F>
// export function $C<A, B, C, D, E, F, H>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, h: Parser<H>): Parser<A | B | C | D | E | F | H>
// export function $C<A, B, C, D, E, F, H, I>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, h: Parser<H>, i: Parser<I>): Parser<A | B | C | D | E | F | H | I>
// export function $C<A, B, C, D, E, F, H, I, J>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, h: Parser<H>, i: Parser<I>, j: Parser<J>): Parser<A | B | C | D | E | F | H | I | J>

export function $C<T extends any[]>(...terms: { [I in keyof T]: Parser<T[I]> }): Parser<T[number]> {
  return (state: ParseState) => {
    let i = 0
    const l = terms.length

    while (i < l) {
      const r = terms[i++](state);
      if (r) return r
    }

    return
  }
}

// export function $S(): Parser<[]>
// export function $S<A>(fn: Parser<A>): Parser<[A]>
// export function $S<A, B>(a: Parser<A>, b: Parser<B>): Parser<[A, B]>
// export function $S<A, B, C>(a: Parser<A>, b: Parser<B>, c: Parser<C>): Parser<[A, B, C]>
// export function $S<A, B, C, D>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>): Parser<[A, B, C, D]>
// export function $S<A, B, C, D, E>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>): Parser<[A, B, C, D, E]>
// export function $S<A, B, C, D, E, F>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>): Parser<[A, B, C, D, E, F]>
// export function $S<A, B, C, D, E, F, G>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, g: Parser<G>): Parser<[A, B, C, D, E, F, G]>
// export function $S<A, B, C, D, E, F, G, H>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, g: Parser<G>, h: Parser<H>): Parser<[A, B, C, D, E, F, G, H]>
// export function $S<A, B, C, D, E, F, G, H, I>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, g: Parser<G>, h: Parser<H>, i: Parser<I>): Parser<[A, B, C, D, E, F, G, H, I]>
// export function $S<A, B, C, D, E, F, G, H, I, J>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, g: Parser<G>, h: Parser<H>, i: Parser<I>, j: Parser<J>): Parser<[A, B, C, D, E, F, G, H, I, J]>

export function $S<T extends any[]>(...terms: { [I in keyof T]: Parser<T[I]> }): Parser<T> {
  return (state: ParseState) => {
    let { input, pos } = state
    let i = 0, value
    const results = [] as unknown as T, s = pos, l = terms.length

    while (i < l) {
      const r = terms[i++]({ input, pos })

      if (r) {
        ({ pos, value } = r)
        results.push(value)
      } else
        return
    }

    return {
      loc: {
        pos: s,
        length: pos - s,
      },
      pos: pos,
      value: results,
    }
  }
}

// a? zero or one
export function $E<T>(fn: Parser<T>): Parser<T | undefined> {
  return (state: ParseState) => {
    const r = fn(state)
    if (r) return r

    const { pos } = state
    return {
      loc: {
        pos: pos,
        length: 0
      },
      pos: pos,
      value: undefined
    }
  }
}

// *
// NOTE: zero length repetitions (where position doesn't advance) return
// an empty array of values. A repetition where the position doesn't advance
// would be an infinite loop, so this avoids that problem cleanly.

// Since this always returns a result `&x*` will always succeed and `!x*` will
// always fail. Same goes for `&x?` and `!x?`. Relatedly `&x+ == &x` and
// `!x+ == !x`.
export function $Q<T>(fn: Parser<T>): Parser<T[]> {
  return (state) => {
    let { input, pos } = state
    let value: T

    const s = pos
    const results: T[] = []

    while (true) {
      const prevPos = pos
      const r = fn({ input, pos })
      if (r == undefined) break

      ({ pos, value } = r)
      if (pos === prevPos)
        break
      else
        results.push(value)
    }

    return {
      loc: {
        pos: s,
        length: pos - s,
      },
      pos: pos,
      value: results
    }
  }
}

// + one or more
export function $P<T>(fn: Parser<T>): Parser<T[]> {
  return (state: ParseState) => {
    const { input, pos: s } = state
    let value: T

    const first = fn(state)
    if (!first) return

    let { pos } = first
    const results = [first.value]

    while (true) {
      const prevPos = pos

      const r = fn({ input, pos })
      if (!r) break

      ({ pos, value } = r)
      if (pos === prevPos)
        break

      results.push(value)
    }

    return {
      loc: {
        pos: s,
        length: pos - s,
      },
      value: results,
      pos: pos
    }
  }
}

// $ prefix operator, convert result value to a string spanning the
// matched input
export function $TEXT(fn: Parser<unknown>): Parser<string> {
  return (state: ParseState) => {
    const newState = fn(state)
    if (!newState) return

    newState.value = state.input.substring(state.pos, newState.pos)
    return newState as ParseResult<string>
  }
}

// ! prefix operator
export function $N(fn: Parser<unknown>): Parser<undefined> {
  return (state: ParseState) => {
    const newState = fn(state)

    if (newState)
      return

    return {
      loc: {
        pos: state.pos,
        length: 0,
      },
      value: undefined,
      pos: state.pos,
    }
  }

}

// & prefix operator
export function $Y(fn: Parser<unknown>): Parser<undefined> {
  return (state: ParseState) => {
    const newState = fn(state)

    if (!newState) return

    return {
      loc: {
        pos: state.pos,
        length: 0,
      },
      value: undefined,
      pos: state.pos,
    }
  }
}

// Result handler for sequence expressions
// $0 is the whole array followed by first element as $1, second element as $2, etc.
// export function makeResultHandler_S<A, B, C, S extends [A, B, C], T>(fn: ($loc: Loc, $0: S, $1: A, $2: B, $3: C)): (result: MaybeResult<S>) => (MaybeResult<T>)

export function makeResultHandler_S<S extends any[], T>(fn: ($loc: Loc, $0: S, ...args: S) => T): (result: MaybeResult<S>) => (MaybeResult<T>) {
  return function (result) {
    if (result) {
      const { loc, value } = result
      const mappedValue = fn(loc, value, ...value)

      //@ts-ignore
      result.value = mappedValue
      return result as unknown as ParseResult<T>
    }
  }
}

// Result handler for regexp match expressions
// $0 is the whole match, followed by $1, $2, etc.
export function makeResultHandler_R<T>(fn: ($loc: Loc, ...args: string[]) => T): (result: MaybeResult<string[]>) => (MaybeResult<T>) {
  return function (result) {
    if (result) {
      const { loc, value } = result
      const mappedValue = fn(loc, ...value)

      //@ts-ignore
      result.value = mappedValue
      return result as unknown as ParseResult<T>
    }
  }
}

// Result handler for all other kinds, $loc, $0 and $1 are both the value
export function makeResultHandler<B>(fn: ($loc: Loc, $0: any, $1: any) => B): (result: MaybeResult<any>) => (MaybeResult<B>) {
  return function (result) {
    if (result) {
      const { loc, value } = result
      const mappedValue = fn(loc, value, value)

      //@ts-ignore
      result.value = mappedValue
      return result as unknown as ParseResult<B>
    }
  }
}

// Identity handler, probably not actually needed
export function defaultHandler<T>(result: MaybeResult<T>): MaybeResult<T> {
  return result
}

export function defaultRegExpHandler(result: MaybeResult<RegExpMatchArray>): MaybeResult<string> {
  if (result) {
    //@ts-ignore
    result.value = result.value[0]
    //@ts-ignore
    return result
  }
}

export function defaultRegExpTransform(fn: Parser<RegExpMatchArray>): Parser<string> {
  return function (state) {
    return defaultRegExpHandler(fn(state));
  }
}

/** Utility function to convert position in a string input to line:colum */
function location(input: string, pos: number) {
  const [line, column] = input.split(/\n|\r\n|\r/).reduce(([row, col], line) => {
    const l = line.length + 1
    if (pos > l) {
      pos -= l
      return [row + 1, 1]
    } else if (pos >= 0) {
      col += pos
      pos = -1
      return [row, col]
    } else {
      return [row, col]
    }
  }, [1, 1])

  return `${line}:${column}`
}

export interface ParserOptions {
  /** The name of the file being parsed */
  filename?: string
}

const failHintRegex = /\S+|[^\S]+|$/y

export function parserState<T>(parser: Parser<T>) {
  // Error tracking
  // Goal is zero allocations
  const failExpected = Array(16)
  let failIndex = 0
  let maxFailPos = 0

  function fail(pos: number, expected: any) {
    if (pos < maxFailPos) return

    if (pos > maxFailPos) {
      maxFailPos = pos
      failExpected.length = failIndex = 0
    }

    failExpected[failIndex++] = expected

    return
  }

  // Pretty print a string or RegExp literal
  // TODO: could expand to all rules?
  // Includes looking up the name
  function prettyPrint(v: string | RegExp) {
    let pv;

    if (v instanceof RegExp) {
      const s = v.toString()
      // Would prefer to use -v.flags.length, but IE doesn't support .flags
      pv = s.slice(0, s.lastIndexOf('/') + 1)
    } else {
      pv = JSON.stringify(v)
    }

    const name = false; // _names.get(v)

    if (name) {
      return "#{name} #{pv}"
    } else {
      return pv
    }
  }

  function validate<T>(input: string, result: MaybeResult<T>, { filename }: { filename: string }) {
    if (result && result.pos === input.length)
      return result.value

    const expectations = Array.from(new Set(failExpected.slice(0, failIndex)))
    let l = location(input, maxFailPos)

    // The parse completed with a result but there is still input
    if (result && result.pos > maxFailPos) {
      l = location(input, result.pos)
      throw new Error(`
${filename}:${l} Unconsumed input at #{l}

${input.slice(result.pos)}
    `)
    } else if (expectations.length) {
      failHintRegex.lastIndex = maxFailPos
      let [hint] = input.match(failHintRegex)!

      if (hint.length)
        hint = prettyPrint(hint)
      else
        hint = "EOF"

      throw new Error(`
${filename}:${l} Failed to parse
Expected:
\t${expectations.map(prettyPrint).join("\n\t")}
Found: ${hint}
`)
    } else if (result)
      throw new Error(`
Unconsumed input at ${l}

${input.slice(result.pos)}
`);
  }

  return {
    $L: function (state: ParseState, str: string) {
      return $L(state, str, fail)
    },
    $R: function (state: ParseState, re: RegExp) {
      return $R(state, re, fail)
    },
    parse: (input: string, options: ParserOptions = {}) => {
      const filename = options.filename || "<anonymous>";

      failIndex = 0
      maxFailPos = 0
      failExpected.length = 0

      return validate(input, parser({ input, pos: 0 }), {
        filename: filename
      })
    }
  }
}