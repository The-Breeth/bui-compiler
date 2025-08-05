import { ParsedAST } from '../types';

let initialized = false;
let createToken: any, Lexer: any, CstParser: any, IToken: any;
let WhiteSpace: any, Profile: any, BPod: any, Dashes: any, LCurly: any, RCurly: any,
  LSquare: any, RSquare: any, Colon: any, Comma: any, StringLiteral: any,
  NumberLiteral: any, True: any, False: any, NullTok: any, Identifier: any;
let allTokens: any[], BuiLexer: any, parser: any, astBuilder: any;

async function init() {
  if (initialized) return;
  // @ts-ignore - Chevrotain ESM module without types for direct path
  const chev: any = await import('chevrotain/lib/chevrotain.mjs');
  ({ createToken, Lexer, CstParser, IToken } = chev);

  WhiteSpace = createToken({ name: 'WhiteSpace', pattern: /\s+/, group: Lexer.SKIPPED });
  Profile = createToken({ name: 'Profile', pattern: /profile/ });
  BPod = createToken({ name: 'BPod', pattern: /b-pod/ });
  Dashes = createToken({ name: 'Dashes', pattern: /---/ });
  LCurly = createToken({ name: 'LCurly', pattern: /\{/ });
  RCurly = createToken({ name: 'RCurly', pattern: /\}/ });
  LSquare = createToken({ name: 'LSquare', pattern: /\[/ });
  RSquare = createToken({ name: 'RSquare', pattern: /\]/ });
  Colon = createToken({ name: 'Colon', pattern: /:/ });
  Comma = createToken({ name: 'Comma', pattern: /,/ });
  StringLiteral = createToken({ name: 'StringLiteral', pattern: /"([^"\\]|\\.)*"/ });
  NumberLiteral = createToken({ name: 'NumberLiteral', pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/ });
  True = createToken({ name: 'True', pattern: /true/ });
  False = createToken({ name: 'False', pattern: /false/ });
  NullTok = createToken({ name: 'Null', pattern: /null/ });
  Identifier = createToken({ name: 'Identifier', pattern: /[a-zA-Z_][a-zA-Z0-9_]*/ });

  allTokens = [
    WhiteSpace,
    Profile,
    BPod,
    True,
    False,
    NullTok,
    StringLiteral,
    NumberLiteral,
    LCurly,
    RCurly,
    LSquare,
    RSquare,
    Comma,
    Colon,
    Dashes,
    Identifier,
  ];

  BuiLexer = new Lexer(allTokens);

  class BuiParser extends CstParser {
    constructor() {
      super(allTokens, { maxLookahead: 2 });
      this.performSelfAnalysis();
    }

    public file = this.RULE('file', () => {
      this.SUBRULE(this.profileSection);
      this.MANY(() => {
        this.CONSUME(Dashes);
        this.SUBRULE(this.bpodSection);
      });
    });

    public profileOnly = this.RULE('profileOnly', () => {
      this.SUBRULE(this.profileSection);
    });

    public bpodOnly = this.RULE('bpodOnly', () => {
      this.SUBRULE(this.bpodSection);
    });

    private profileSection = this.RULE('profileSection', () => {
      this.CONSUME(Profile);
      this.CONSUME(Colon);
      this.SUBRULE(this.object);
    });

    private bpodSection = this.RULE('bpodSection', () => {
      this.CONSUME(BPod);
      this.CONSUME(StringLiteral);
      this.SUBRULE(this.object);
    });

    private object = this.RULE('object', () => {
      this.CONSUME(LCurly);
      this.OPTION(() => {
        this.SUBRULE(this.property);
        this.MANY(() => {
          this.CONSUME(Comma);
          this.SUBRULE2(this.property);
        });
      });
      this.CONSUME(RCurly);
    });

    private property = this.RULE('property', () => {
      this.OR([
        { ALT: () => this.CONSUME(StringLiteral) },
        { ALT: () => this.CONSUME(Identifier) },
      ]);
      this.CONSUME(Colon);
      this.SUBRULE(this.value);
    });

    private array = this.RULE('array', () => {
      this.CONSUME(LSquare);
      this.OPTION(() => {
        this.SUBRULE(this.value);
        this.MANY(() => {
          this.CONSUME(Comma);
          this.SUBRULE2(this.value);
        });
      });
      this.CONSUME(RSquare);
    });

    private value = this.RULE('value', () => {
      this.OR([
        { ALT: () => this.CONSUME(StringLiteral) },
        { ALT: () => this.CONSUME(NumberLiteral) },
        { ALT: () => this.SUBRULE(this.object) },
        { ALT: () => this.SUBRULE(this.array) },
        { ALT: () => this.CONSUME(True) },
        { ALT: () => this.CONSUME(False) },
        { ALT: () => this.CONSUME(NullTok) },
      ]);
    });
  }

  parser = new BuiParser();
  const BaseVisitor = parser.getBaseCstVisitorConstructor();

  class AstBuilder extends BaseVisitor {
    constructor() {
      super();
      this.validateVisitor();
    }

    file(ctx: any): ParsedAST {
      const profile = this.visit(ctx.profileSection[0]);
      const bPods = (ctx.bpodSection || []).map((b: any) => this.visit(b));
      return { profile, bPods };
    }

    profileOnly(ctx: any): any {
      return this.visit(ctx.profileSection[0]);
    }

    bpodOnly(ctx: any): any {
      return this.visit(ctx.bpodSection[0]);
    }

    profileSection(ctx: any): any {
      return this.visit(ctx.object[0]);
    }

    bpodSection(ctx: any): any {
      const nameTok: typeof IToken = ctx.StringLiteral[0];
      const obj = this.visit(ctx.object[0]);
      return { name: stripQuotes(nameTok.image), ...obj };
    }

    object(ctx: any): any {
      const obj: any = {};
      if (ctx.property) {
        ctx.property.forEach((p: any) => {
          const { key, value } = this.visit(p);
          obj[key] = value;
        });
      }
      return obj;
    }

    property(ctx: any): any {
      const keyTok: typeof IToken = ctx.StringLiteral ? ctx.StringLiteral[0] : ctx.Identifier[0];
      const key = stripQuotes(keyTok.image);
      const value = this.visit(ctx.value[0]);
      return { key, value };
    }

    array(ctx: any): any[] {
      const arr: any[] = [];
      if (ctx.value) {
        ctx.value.forEach((v: any) => arr.push(this.visit(v)));
      }
      return arr;
    }

    value(ctx: any): any {
      if (ctx.StringLiteral) return stripQuotes(ctx.StringLiteral[0].image);
      if (ctx.NumberLiteral) return Number(ctx.NumberLiteral[0].image);
      if (ctx.object) return this.visit(ctx.object[0]);
      if (ctx.array) return this.visit(ctx.array[0]);
      if (ctx.True) return true;
      if (ctx.False) return false;
      return null; // Null token
    }
  }

  astBuilder = new AstBuilder();
  initialized = true;
}

function stripQuotes(str: string): string {
  return str.replace(/^"|"$/g, '');
}

export async function parseSingleContent(content: string): Promise<ParsedAST> {
  await init();
  const lex = BuiLexer.tokenize(content);
  if (lex.errors.length) {
    throw new Error('Lexing errors detected');
  }
  parser.input = lex.tokens;
  const cst = parser.file();
  if (parser.errors.length) {
    throw new Error('Parsing errors detected');
  }
  return astBuilder.file(cst);
}

export async function parseProfileContent(content: string): Promise<any> {
  await init();
  const lex = BuiLexer.tokenize(content);
  if (lex.errors.length) throw new Error('Lexing errors detected');
  parser.input = lex.tokens;
  const cst = parser.profileOnly();
  if (parser.errors.length) throw new Error('Parsing errors detected');
  return astBuilder.profileOnly(cst);
}

export async function parseBpodContent(content: string): Promise<any> {
  await init();
  const lex = BuiLexer.tokenize(content);
  if (lex.errors.length) throw new Error('Lexing errors detected');
  parser.input = lex.tokens;
  const cst = parser.bpodOnly();
  if (parser.errors.length) throw new Error('Parsing errors detected');
  return astBuilder.bpodOnly(cst);
}

export async function parseFromFiles(files: Record<string, string>): Promise<ParsedAST> {
  if (files['index.bui']) {
    const profile = await parseProfileContent(files['index.bui']);
    const bPodsPromises = Object.entries(files)
      .filter(([name]) => name !== 'index.bui' && name.endsWith('.bui'))
      .map(([, content]) => parseBpodContent(content));
    const bPods = await Promise.all(bPodsPromises);
    return { profile, bPods };
  }
  const firstKey = Object.keys(files)[0];
  return parseSingleContent(files[firstKey]);
}

