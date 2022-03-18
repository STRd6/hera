{decompile} = require "../source/util"
hera = require "../source/main"

describe "util", ->
  it "should parse decompiled rules", ->
    grammar = decompile(hera.rules)

    # console.log grammar
    parsedRules = hera.parse grammar
    # console.log parsedRules, hera.rules

    Object.keys(parsedRules).forEach (key) ->
      assert.deepEqual(parsedRules[key], hera.rules[key], "#{key} rule doesn't match")

    # strip trailing whitespace before compare
    grammar = grammar.replace(/[ ]+\n/g, '\n')
    assert.equal grammar, readFile("samples/hera.hera")

  it "should decompile nested choices", ->
    rules = hera.parse """
      Rule
        ("A" / "C") ("B" / "D")
        "Z" -> "z"
    """

    decompiled = decompile rules
    assert.deepEqual hera.parse(decompiled), rules