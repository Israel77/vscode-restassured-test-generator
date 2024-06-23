import { commands, ExtensionContext } from "vscode";
import { TestGeneratorPanel } from "./panels/HelloWorldPanel";

export function activate(context: ExtensionContext) {
    // Create the show hello world command
    const openTestGenerator = commands.registerCommand("restassured-test-generator.openTestGenerator", () => {
        TestGeneratorPanel.render(context.extensionUri);
    });

    // Add command to the extension context
    context.subscriptions.push(openTestGenerator);
}
