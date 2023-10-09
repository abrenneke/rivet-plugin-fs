import type {
  ChartNode,
  EditorDefinition,
  Inputs,
  InternalProcessContext,
  NodeBodySpec,
  NodeId,
  NodeInputDefinition,
  NodeOutputDefinition,
  NodeUIData,
  Outputs,
  PluginNodeImpl,
  PortId,
  Rivet,
} from "@ironclad/rivet-core";

export type ShellCommandNode = ChartNode<"shellCommand", ShellCommandNodeData>;

export type ShellCommandNodeData = {
  workingDirectory: string;
  useWorkingDirectoryInput?: boolean;

  command: string;
  useCommandInput?: boolean;

  errorOnNonZeroExitCode?: boolean;
};

export default function (rivet: typeof Rivet) {
  const nodeImpl: PluginNodeImpl<ShellCommandNode> = {
    create(): ShellCommandNode {
      const node: ShellCommandNode = {
        id: rivet.newId<NodeId>(),

        data: {
          command: "",
          useCommandInput: true,

          workingDirectory: "",
          useWorkingDirectoryInput: true,

          errorOnNonZeroExitCode: false,
        },

        title: "Shell Command",
        type: "shellCommand",

        visualData: {
          x: 0,
          y: 0,
          width: 200,
        },
      };
      return node;
    },

    getInputDefinitions(data: ShellCommandNodeData): NodeInputDefinition[] {
      const inputs: NodeInputDefinition[] = [];

      if (data.useWorkingDirectoryInput) {
        inputs.push({
          id: "workingDirectory" as PortId,
          dataType: "string",
          title: "Working Directory",
        });
      }

      if (data.useCommandInput) {
        inputs.push({
          id: "command" as PortId,
          dataType: "string",
          title: "Command",
        });
      }

      return inputs;
    },

    getOutputDefinitions(_data: ShellCommandNodeData): NodeOutputDefinition[] {
      return [
        {
          id: "output" as PortId,
          dataType: "string",
          title: "Output",
        },
        {
          id: "stdout" as PortId,
          dataType: "string",
          title: "Stdout",
        },
        {
          id: "stderr" as PortId,
          dataType: "string",
          title: "Stderr",
        },
        {
          id: "exitCode" as PortId,
          dataType: "number",
          title: "Exit Code",
        },
      ];
    },

    getUIData(): NodeUIData {
      return {
        contextMenuTitle: "Shell Command",
        group: "FS",
        infoBoxBody: "Executes a shell command in the working directory.",
        infoBoxTitle: "Shell Command Node",
      };
    },

    getEditors(
      _data: ShellCommandNodeData
    ): EditorDefinition<ShellCommandNode>[] {
      return [
        {
          type: "string",
          dataKey: "workingDirectory",
          useInputToggleDataKey: "useWorkingDirectoryInput",
          label: "Working Directory",
        },
        {
          type: "string",
          dataKey: "command",
          useInputToggleDataKey: "useCommandInput",
          label: "Command",
        },
        {
          type: "toggle",
          dataKey: "errorOnNonZeroExitCode",
          label: "Error on Non-Zero Exit Code",
        },
      ];
    },

    getBody(
      data: ShellCommandNodeData
    ): string | NodeBodySpec | NodeBodySpec[] | undefined {
      return rivet.dedent`
          Working Directory: ${
            data.useWorkingDirectoryInput
              ? "(From Input)"
              : data.workingDirectory
          }
          Command: ${data.useCommandInput ? "(From Input)" : data.command}
        `;
    },

    async process(
      data: ShellCommandNodeData,
      inputData: Inputs,
      context: InternalProcessContext
    ): Promise<Outputs> {
      if (context.executor !== "nodejs") {
        throw new Error("This node can only be run using a nodejs executor.");
      }

      const workingDirectory = rivet.getInputOrData(
        data,
        inputData,
        "workingDirectory",
        "string"
      );

      if (!workingDirectory.trim()) {
        throw new Error("Working directory cannot be empty.");
      }

      const command = rivet.getInputOrData(
        data,
        inputData,
        "command",
        "string"
      );

      if (!command.trim()) {
        throw new Error("Command cannot be empty.");
      }

      if (command.includes("..")) {
        throw new Error("Command cannot contain '..'");
      }

      const { shell } = await import("../nodeEntry");

      const { all, stdout, stderr, exitCode } = await shell(command, {
        cwd: workingDirectory,
      });

      if (data.errorOnNonZeroExitCode && exitCode !== 0) {
        throw new Error(`Command exited with non-zero exit code: ${exitCode}`);
      }

      return {
        ["output" as PortId]: {
          type: "string",
          value: all,
        },
        ["stdout" as PortId]: {
          type: "string",
          value: stdout,
        },
        ["stderr" as PortId]: {
          type: "string",
          value: stderr,
        },
        ["exitCode" as PortId]: {
          type: "number",
          value: exitCode,
        },
      };
    },
  };

  const nodeDefinition = rivet.pluginNodeDefinition(nodeImpl, "Shell Command");

  return nodeDefinition;
}
