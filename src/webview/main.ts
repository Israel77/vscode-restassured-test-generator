import {
    provideVSCodeDesignSystem,
    Button,
    TextArea,
    Checkbox,
    Dropdown,
    allComponents,
    TextField
} from "@vscode/webview-ui-toolkit";

import { Compiler, VarOrValue } from "restassured-test-generator";
import { CompilerOptions } from "restassured-test-generator/types/compiler/compiler"
import { HTTPMethod } from "restassured-test-generator/types/compiler/generator";

provideVSCodeDesignSystem().register(allComponents);

window.addEventListener("load", main);

const options: CompilerOptions = {};

// Main function that gets executed once the webview DOM loads
function main() {
    const generateTestsButton = document.getElementById("generate-tests") as Button;

    generateTestsButton?.addEventListener("click", generateTests);
}


function generateTests() {
    const inputTextArea = document.getElementById("input-json") as TextArea;
    const outputTestsElement = document.getElementById("output-tests") as HTMLPreElement;

    if (inputTextArea?.value.trim()) {
        console.log("Generating tests...");
        updateOptions();

        const tests = Compiler.compile(inputTextArea.value, options);
        outputTestsElement.textContent = tests ?? outputTestsElement.textContent;
        console.log("Tests generated!");
    }
}

function updateOptions() {
    const simplifyOutputCheckbox = document.getElementById("simplify-output") as Checkbox;
    const httpMethodDropdown = document.getElementById("http-method") as Dropdown;
    const urlInputTextField = document.getElementById("input-url") as TextField;
    const statusCodeInputTextField = document.getElementById("status-code") as TextField;

    options.simplify = simplifyOutputCheckbox.checked;

    if (httpMethodDropdown.value && urlInputTextField?.value.trim()) {
        options.generatorOptions = options.generatorOptions ?? {};
        options.generatorOptions.request = options.generatorOptions.request ?? {};

        options.generatorOptions.request.method = httpMethodDropdown.value as HTTPMethod;
        options.generatorOptions.request.url = new VarOrValue(urlInputTextField.value.trim()).asValue();
        options.generatorOptions.statusCode = parseInt(statusCodeInputTextField.value.trim());
    }

}