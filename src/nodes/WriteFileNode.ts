// **** IMPORTANT ****
// Make sure you do `import type` and do not pull in the entire Rivet core library here.
// Export a function that takes in a Rivet object, and you can access rivet library functionality
// from there.
import type {
  ChartNode,
  EditorDefinition,
  Inputs,
  InternalProcessContext,
  NodeBodySpec,
  NodeConnection,
  NodeId,
  NodeInputDefinition,
  NodeOutputDefinition,
  NodeUIData,
  Outputs,
  PluginNodeImpl,
  PortId,
  Project,
  Rivet,
} from "@ironclad/rivet-core";

export type WriteFileNode = ChartNode<"writeFile", WriteFileNodeData>;

export type WriteFileNodeData = {
  path: string;
  usePathInput?: boolean;

  content: string;
  useContentInput?: boolean;
};

export default function (rivet: typeof Rivet) {
  const nodeImpl: PluginNodeImpl<WriteFileNode> = {
    create(): WriteFileNode {
      const node: WriteFileNode = {
        id: rivet.newId<NodeId>(),

        data: {
          path: "",
          usePathInput: true,
          content: "",
          useContentInput: true,
        },

        title: "Write File",
        type: "writeFile",

        visualData: {
          x: 0,
          y: 0,
          width: 200,
        },
      };
      return node;
    },

    getInputDefinitions(data: WriteFileNodeData): NodeInputDefinition[] {
      const inputs: NodeInputDefinition[] = [];

      inputs.push({
        id: "baseDirectory" as PortId,
        dataType: "string",
        title: "Base Directory",
      });

      if (data.usePathInput) {
        inputs.push({
          id: "path" as PortId,
          dataType: "string",
          title: "Path",
        });
      }

      if (data.useContentInput) {
        inputs.push({
          id: "content" as PortId,
          dataType: "string",
          title: "Content",
        });
      }

      return inputs;
    },

    getOutputDefinitions(_data: WriteFileNodeData): NodeOutputDefinition[] {
      return [
        {
          id: "content_out" as PortId,
          dataType: "string",
          title: "Content",
        },
      ];
    },

    // This returns UI information for your node, such as how it appears in the context menu.
    getUIData(): NodeUIData {
      return {
        contextMenuTitle: "Write File",
        group: "FS",
        infoBoxBody: "Writes to a file relative to the base directory.",
        infoBoxTitle: "Write File Node",
      };
    },

    // This function defines all editors that appear when you edit your node.
    getEditors(_data: WriteFileNodeData): EditorDefinition<WriteFileNode>[] {
      return [
        {
          type: "string",
          dataKey: "path",
          useInputToggleDataKey: "usePathInput",
          label: "Path",
        },
        {
          type: "code",
          dataKey: "content",
          useInputToggleDataKey: "useContentInput",
          label: "Arguments",
          language: "plaintext",
        },
      ];
    },

    // This function returns the body of the node when it is rendered on the graph. You should show
    // what the current data of the node is in some way that is useful at a glance.
    getBody(
      data: WriteFileNodeData
    ): string | NodeBodySpec | NodeBodySpec[] | undefined {
      return rivet.dedent`
        Path: ${data.path}
        Content: ${data.content}
      `;
    },

    // This is the main processing function for your node. It can do whatever you like, but it must return
    // a valid Outputs object, which is a map of port IDs to DataValue objects. The return value of this function
    // must also correspond to the output definitions you defined in the getOutputDefinitions function.
    async process(
      data: WriteFileNodeData,
      inputData: Inputs,
      context: InternalProcessContext
    ): Promise<Outputs> {
      if (context.executor !== "nodejs") {
        throw new Error("This node can only be run using a nodejs executor.");
      }

      console.dir({ inputData });

      const baseDirectory = rivet.expectType(
        inputData["baseDirectory" as PortId],
        "string"
      );

      const path = rivet.getInputOrData(data, inputData, "path", "string");

      const contents = rivet.getInputOrData(
        data,
        inputData,
        "content",
        "string"
      );

      if (path.includes("..")) {
        throw new Error("Path cannot contain '..'");
      }

      const { writeFile, join } = await import("../nodeEntry");

      await writeFile(join(baseDirectory, path), contents);

      return {
        ["output" as PortId]: {
          type: "string",
          value: contents,
        },
      };
    },
  };

  const nodeDefinition = rivet.pluginNodeDefinition(nodeImpl, "Write File");

  return nodeDefinition;
}
