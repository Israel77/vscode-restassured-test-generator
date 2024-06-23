import { provideVSCodeDesignSystem, vsCodeButton, Button, vsCodeTextArea, TextArea, vsCodeCheckbox, Checkbox } from "@vscode/webview-ui-toolkit";
import { Compiler } from "restassured-test-generator";

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeTextArea(), vsCodeCheckbox());

window.addEventListener("load", main);

// Main function that gets executed once the webview DOM loads
function main() {
    const generateTestsButton = document.getElementById("generate-tests") as Button;

    generateTestsButton?.addEventListener("click", generateTests);
}

function generateTests() {
    const inputTextArea = document.getElementById("input-json") as TextArea;
    const outputTestsElement = document.getElementById("output-tests") as HTMLPreElement;
    const simplifyOutputCheckbox = document.getElementById("simplify-output") as Checkbox;

    if (inputTextArea?.value.trim()) {
        console.log("Generating tests...");
        const options = {
            simplify: simplifyOutputCheckbox.checked,
            generatorOptions: {
                format: true
            }
        };
        const tests = Compiler.compile(inputTextArea.value, options);
        console.log("Tests generated!");
        console.log(tests);
        outputTestsElement.textContent = tests ?? outputTestsElement.textContent;
    }
}