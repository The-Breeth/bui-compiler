# Breeth BUI Compiler

## Overview
The Breeth BUI Compiler is a TypeScript-based tool designed to parse, validate, and compile .bui files into an internal JSON Abstract Syntax Tree (AST). This compiler adheres to the specifications outlined for Breeth Extensions (B-Pods) and provides a structured approach to managing audio processing services.

## Project Structure
The project is organized into the following directories and files:

- **src/**: Contains the source code for the compiler.
  - **ast/**: Defines the AST structure used for representing parsed .bui files.
  - **parser/**: Implements the logic for parsing .bui files into ASTs.
  - **validator/**: Contains validation rules for .bui files.
  - **errors/**: Defines custom error classes and handling utilities.
  - **types/**: Contains TypeScript types and interfaces used throughout the project.
  - **utils/**: Includes utility functions for various tasks.
  - **index.ts**: The main entry point for the compiler.

- **test/**: Contains unit and integration tests for the compiler's functionality.
  - **parser.test.ts**: Tests for the parser functionality.
  - **validator.test.ts**: Tests for the validator functionality.
  - **compiler.test.ts**: Integration tests for the overall compiler functionality.

- **package.json**: Configuration file for npm, listing dependencies and scripts.
- **tsconfig.json**: TypeScript configuration file specifying compiler options.
- **README.md**: Documentation for the project.

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd breeth-bui-compiler
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage
To compile a .bui file, you can use the main entry point in `src/index.ts`. The compiler will parse the file, validate its contents, and produce an internal JSON AST.

## Contribution Guidelines
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them.
4. Push your branch and create a pull request.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.