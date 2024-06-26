import { CompilerOptions } from "restassured-test-generator/types/compiler/compiler";

// As of the current version of the extension, there is a one-to-one relation
// between the view state and the compiler options.
// This might change in the future.
export type ViewState = {
    inputJson?: string,
    outputTests?: string,
    compilerOptions?: CompilerOptions
}