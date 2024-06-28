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
import { HTTPMethod } from "restassured-test-generator/types/compiler/generator";
import { ViewState } from "./types";

import hljs from "highlight.js/lib/core";
import java from "highlight.js/lib/languages/java";

provideVSCodeDesignSystem().register(allComponents);
hljs.registerLanguage("java", java)

window.addEventListener("load", main);

const vsCode = acquireVsCodeApi();

// Syncs the current state
setInterval(updateState, 100);

// Main function that gets executed once the webview DOM loads
function main() {
    const generateTestsButton = document.getElementById("generate-tests") as Button;

    generateTestsButton?.addEventListener("click", generateTests);

    loadToView(vsCode.getState() as ViewState);
}

function generateTests() {
    let viewState = vsCode.getState() as ViewState;

    if (viewState.inputJson) {
        console.info("Generating tests...");

        const tests = Compiler.compile(viewState.inputJson, viewState.compilerOptions) as string;
        viewState = {
            ...viewState,
            outputTests: hljs.highlight("java", tests).value
        }
        console.info("Tests generated!");
        vsCode.setState(viewState);
        loadToView(viewState);
    }
}

function updateState() {
    // Input and output
    const inputJsonTextArea = document.getElementById("input-json") as TextArea;
    const outputTestsElement = document.getElementById("output-tests") as HTMLPreElement;

    // Options
    const simplifyOutputCheckbox = document.getElementById("simplify-output") as Checkbox;
    const statusCodeInputTextField = document.getElementById("status-code") as TextField;

    // Request specification
    const httpMethodDropdown = document.getElementById("http-method") as Dropdown;
    const urlInputTextField = document.getElementById("input-url") as TextField;
    const inputBodyTextArea = document.getElementById("input-body") as TextArea;
    const bodyIsVariableCheckbox = document.getElementById("is-body-variable") as Checkbox;


    const viewState: ViewState = vsCode.getState() || {};

    // Input and output
    viewState.inputJson = inputJsonTextArea.value;
    viewState.outputTests = outputTestsElement.textContent ?? "";

    // Compiler options
    viewState.compilerOptions ??= {};
    viewState.compilerOptions.simplify = simplifyOutputCheckbox.checked;

    // Generator options
    viewState.compilerOptions.generatorOptions ??= {};

    const statusCode = parseInt(statusCodeInputTextField.value.trim());
    if (Number.isNaN(statusCode)) {
        viewState.compilerOptions.generatorOptions.statusCode = undefined;
    } else {
        viewState.compilerOptions.generatorOptions.statusCode = statusCode;
    }

    // Request specification
    viewState.compilerOptions.generatorOptions.request ??= {};

    const url = new VarOrValue(urlInputTextField.value.trim()).asValue();
    if (url != "") {
        viewState.compilerOptions.generatorOptions.request.method = httpMethodDropdown.value as HTTPMethod;
        viewState.compilerOptions.generatorOptions.request.url = url;
    } else {
        viewState.compilerOptions.generatorOptions.request.method = undefined;
        viewState.compilerOptions.generatorOptions.request.url = undefined;
    }

    const requestBody = new VarOrValue(inputBodyTextArea.value.trim()).asValue() as VarOrValue;
    const bodyIsVariable = bodyIsVariableCheckbox.checked;
    if (requestBody && bodyIsVariable) {
        viewState.compilerOptions.generatorOptions.request.body = requestBody.asVar().unwrap();
    } else if (requestBody.unwrap() != "") {
        viewState.compilerOptions.generatorOptions.request.body = requestBody.asValue().unwrap();
    }

    vsCode.setState(viewState);
}

function loadToView(viewState?: ViewState) {
    if (viewState === undefined)
        return;

    const simplifyOutputCheckbox = document.getElementById("simplify-output") as Checkbox;
    const httpMethodDropdown = document.getElementById("http-method") as Dropdown;
    const urlInputTextField = document.getElementById("input-url") as TextField;
    const statusCodeInputTextField = document.getElementById("status-code") as TextField;
    const inputTextArea = document.getElementById("input-json") as TextArea;
    const outputTestsElement = document.getElementById("output-tests") as HTMLPreElement;

    // Input and output
    inputTextArea.value = viewState.inputJson ?? "";
    outputTestsElement.innerHTML = viewState.outputTests ?? "Your tests will appear here";

    // Compiler options
    simplifyOutputCheckbox.checked = viewState.compilerOptions?.simplify ?? true;

    // Generator options
    statusCodeInputTextField.value = viewState.compilerOptions?.generatorOptions?.statusCode?.toString() ?? "";

    // Request specification
    httpMethodDropdown.value = viewState.compilerOptions?.generatorOptions?.request?.method || "GET";
    urlInputTextField.value = viewState.compilerOptions?.generatorOptions?.request?.url?.asVar().unwrap() ?? "";
}