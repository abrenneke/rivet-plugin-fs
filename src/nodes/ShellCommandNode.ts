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
  command: string;
  useCommandInput?: boolean;
};

export default function (rivet: typeof Rivet) {
  const nodeImpl: PluginNodeImpl<ShellCommandNode> = {
    create(): ShellCommandNode {
      const node: ShellCommandNode = {
        id: rivet.newId<NodeId>(),

        data: {
          command: "",
          useCommandInput: true,
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

      inputs.push({
        id: "baseDirectory" as PortId,
        dataType: "string",
        title: "Base Directory",
      });

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
      ];
    },

    getUIData(): NodeUIData {
      return {
        contextMenuTitle: "Shell Command",
        group: "FS",
        infoBoxBody: "Executes a shell command in the base directory.",
        infoBoxTitle: "Shell Command Node",
      };
    },

    getEditors(
      _data: ShellCommandNodeData
    ): EditorDefinition<ShellCommandNode>[] {
      return [
        {
          type: "string",
          dataKey: "command",
          useInputToggleDataKey: "useCommandInput",
          label: "Command",
        },
      ];
    },

    getBody(
      data: ShellCommandNodeData
    ): string | NodeBodySpec | NodeBodySpec[] | undefined {
      return rivet.dedent`
          Command: ${data.command}
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

      const baseDirectory = rivet.expectType(
        inputData["baseDirectory" as PortId],
        "string"
      );

      const command = rivet.getInputOrData(
        data,
        inputData,
        "command",
        "string"
      );

      if (command.includes("..")) {
        throw new Error("Command cannot contain '..'");
      }

      const { shell } = await import("../nodeEntry");

      const output = await shell(command, {
        cwd: baseDirectory,
      });

      return {
        ["output" as PortId]: {
          type: "string",
          value: output,
        },
      };
    },
  };

  const nodeDefinition = rivet.pluginNodeDefinition(nodeImpl, "Shell Command");

  return nodeDefinition;
}
