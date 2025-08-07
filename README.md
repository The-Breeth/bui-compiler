# 🧠 Breeth BUI Compiler

The official compiler for `.bui` files — a custom declarative format used to define AI plugin panels for creative tools. This compiler parses, validates, and builds a structured AST from `.bui` files used by the Breeth platform.

---

## ✨ What is a .bui File?

A `.bui` file is a lightweight, markdown-inspired format designed to define:

- 🔌 Plugin interfaces (`bPods`)
- 🧾 Form inputs
- ⚙️ API endpoints
- 🔁 Submit actions
- 📦 Multi-file modularity

Use `.bui` to rapidly build services for creative apps like audio/video editors, design tools, and more.

---

## 📦 Installation

```bash
npm install breeth-bui-compiler
```

---

## 🛠️ Usage

### Programmatic

```js
import { parseBUI } from "breeth-bui-compiler";

const result = await parseBUI("/path/to/your/index.bui");

console.log(result.ast);      // Validated AST
console.log(result.errors);   // Validation errors (if any)
console.log(result.metadata); // File trace metadata
```

### CLI (coming soon)

```bash
npx breeth-bui-compiler validate path/to/file.bui
```

---

## ✅ What It Validates

| Feature               | Status                                         |
| --------------------- | ---------------------------------------------- |
| `.bui` syntax       | ✅ Complete                                    |
| `version` field     | ✅ Required & strict                           |
| `profile` structure | ✅ Required with URL & email checks            |
| `bPods`             | ✅ Full support                                |
| `accepts`           | ✅ Must be lowercase extensions                |
| `inputs`            | ✅ Types, options, and structure validated     |
| `submit`            | ✅ Action & label checks                       |
| `api` config        | ✅ URL, method, body, responseType validated   |
| `bodyTemplate`      | ✅ Requires `{webhook_url}`                  |
| Duplicate `bPods`   | ✅ Disallowed                                  |
| Multi-file support    | ✅ With full include trace                     |
| Error reporting       | ✅ Detailed with type, message, and file trace |

---

## 📁 Project Structure

```
example/
  ├── index.bui              # Main entry
  ├── single-index.bui       # Standalone BUI file
  └── soundai-folder/
      ├── podcast-cleaner.bui
      └── voice-transcriber.bui

src/
  ├── core/                  # Parser and validator logic
  ├── schema/                # Zod validation schema
  └── index.ts               # Compiler entry point

scripts/
  └── run-examples.ts        # Test runner for all example cases
```

---

## 🧪 Running Examples

```bash
node test.js
```

Each `.bui` example is validated and output is shown with:

- ❌ Error list
- 🧠 Parsed AST (if valid)
- 📍 Metadata (file inclusion + pod map)

---

## 🚨 Error Format

```ts
{
  message: string;         // User-facing message
  severity: "error";       // (Future: warning, info)
  line: number;
  column: number;
  file?: string;           // (Planned) Which file the error came from
}
```

---

## 🌐 Use Cases

- 🧱 Define AI plugin panels visually
- 🛠 Integrate microservices into creative apps
- ⚡️ Rapidly prototype tools with declarative UIs
- 💼 Marketplace-ready panel definitions

---

## 💡 Roadmap

- [ ] Include exact file in all error messages
- [ ] CLI tool (`bui compile path.bui`)
- [ ] JSON Schema export
- [ ] VS Code extension
- [ ] Runtime rendering engine

---

## 🤝 Contributing

Want to extend or improve the compiler?
PRs welcome! Please follow the coding style and naming conventions used in `src/`.

---

## 📄 License

MIT License — free for commercial & personal use.

---

## 🔗 About Breeth

Breeth is a next-gen platform for AI-powered creative tooling. We make it easy for developers to build, share, and monetize AI services inside any creative app.

- 🌍 https://thebreeth.com
- 🧑‍💻 Made by [Siva Rama Krishna](https://github.com/sivarama)
