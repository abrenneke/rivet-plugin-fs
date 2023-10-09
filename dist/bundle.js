// src/nodes/ShellCommandNode.ts
function ShellCommandNode_default(rivet) {
  const nodeImpl = {
    create() {
      const node = {
        id: rivet.newId(),
        data: {
          command: "",
          useCommandInput: true,
          workingDirectory: "",
          useWorkingDirectoryInput: true,
          errorOnNonZeroExitCode: false
        },
        title: "Shell Command",
        type: "shellCommand",
        visualData: {
          x: 0,
          y: 0,
          width: 200
        }
      };
      return node;
    },
    getInputDefinitions(data) {
      const inputs = [];
      if (data.useWorkingDirectoryInput) {
        inputs.push({
          id: "workingDirectory",
          dataType: "string",
          title: "Working Directory"
        });
      }
      if (data.useCommandInput) {
        inputs.push({
          id: "command",
          dataType: "string",
          title: "Command"
        });
      }
      return inputs;
    },
    getOutputDefinitions(_data) {
      return [
        {
          id: "output",
          dataType: "string",
          title: "Output"
        },
        {
          id: "stdout",
          dataType: "string",
          title: "Stdout"
        },
        {
          id: "stderr",
          dataType: "string",
          title: "Stderr"
        },
        {
          id: "exitCode",
          dataType: "number",
          title: "Exit Code"
        }
      ];
    },
    getUIData() {
      return {
        contextMenuTitle: "Shell Command",
        group: "FS",
        infoBoxBody: "Executes a shell command in the working directory.",
        infoBoxTitle: "Shell Command Node"
      };
    },
    getEditors(_data) {
      return [
        {
          type: "string",
          dataKey: "workingDirectory",
          useInputToggleDataKey: "useWorkingDirectoryInput",
          label: "Working Directory"
        },
        {
          type: "string",
          dataKey: "command",
          useInputToggleDataKey: "useCommandInput",
          label: "Command"
        },
        {
          type: "toggle",
          dataKey: "errorOnNonZeroExitCode",
          label: "Error on Non-Zero Exit Code"
        }
      ];
    },
    getBody(data) {
      return rivet.dedent`
          Working Directory: ${data.useWorkingDirectoryInput ? "(From Input)" : data.workingDirectory}
          Command: ${data.useCommandInput ? "(From Input)" : data.command}
        `;
    },
    async process(data, inputData, context) {
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
      const { shell } = await import("../dist/nodeEntry.cjs");
      const { all, stdout, stderr, exitCode } = await shell(command, {
        cwd: workingDirectory
      });
      if (data.errorOnNonZeroExitCode && exitCode !== 0) {
        throw new Error(`Command exited with non-zero exit code: ${exitCode}`);
      }
      return {
        ["output"]: {
          type: "string",
          value: all
        },
        ["stdout"]: {
          type: "string",
          value: stdout
        },
        ["stderr"]: {
          type: "string",
          value: stderr
        },
        ["exitCode"]: {
          type: "number",
          value: exitCode
        }
      };
    }
  };
  const nodeDefinition = rivet.pluginNodeDefinition(nodeImpl, "Shell Command");
  return nodeDefinition;
}

// src/nodes/WriteFileNode.ts
function WriteFileNode_default(rivet) {
  const nodeImpl = {
    create() {
      const node = {
        id: rivet.newId(),
        data: {
          baseDirectory: "",
          useBaseDirectoryInput: true,
          path: "",
          usePathInput: true,
          content: "",
          useContentInput: true
        },
        title: "Write File",
        type: "writeFile",
        visualData: {
          x: 0,
          y: 0,
          width: 200
        }
      };
      return node;
    },
    getInputDefinitions(data) {
      const inputs = [];
      if (data.useBaseDirectoryInput) {
        inputs.push({
          id: "baseDirectory",
          dataType: "string",
          title: "Base Directory"
        });
      }
      if (data.usePathInput) {
        inputs.push({
          id: "path",
          dataType: "string",
          title: "Path"
        });
      }
      if (data.useContentInput) {
        inputs.push({
          id: "content",
          dataType: "string",
          title: "Content"
        });
      }
      return inputs;
    },
    getOutputDefinitions(_data) {
      return [
        {
          id: "content_out",
          dataType: "string",
          title: "Content"
        }
      ];
    },
    // This returns UI information for your node, such as how it appears in the context menu.
    getUIData() {
      return {
        contextMenuTitle: "Write File",
        group: "FS",
        infoBoxBody: "Writes to a file relative to the base directory.",
        infoBoxTitle: "Write File Node"
      };
    },
    // This function defines all editors that appear when you edit your node.
    getEditors(_data) {
      return [
        {
          type: "string",
          dataKey: "baseDirectory",
          useInputToggleDataKey: "useBaseDirectoryInput",
          label: "Base Directory"
        },
        {
          type: "string",
          dataKey: "path",
          useInputToggleDataKey: "usePathInput",
          label: "Path"
        },
        {
          type: "code",
          dataKey: "content",
          useInputToggleDataKey: "useContentInput",
          label: "Content",
          language: "plaintext"
        }
      ];
    },
    // This function returns the body of the node when it is rendered on the graph. You should show
    // what the current data of the node is in some way that is useful at a glance.
    getBody(data) {
      return rivet.dedent`
        Base Directory: ${data.useBaseDirectoryInput ? "(From Input)" : data.baseDirectory}
        Path: ${data.usePathInput ? "(From Input)" : data.path}
        Content: ${data.useContentInput ? "(From Input)" : data.content}
      `;
    },
    // This is the main processing function for your node. It can do whatever you like, but it must return
    // a valid Outputs object, which is a map of port IDs to DataValue objects. The return value of this function
    // must also correspond to the output definitions you defined in the getOutputDefinitions function.
    async process(data, inputData, context) {
      if (context.executor !== "nodejs") {
        throw new Error("This node can only be run using a nodejs executor.");
      }
      const baseDirectory = rivet.getInputOrData(
        data,
        inputData,
        "baseDirectory",
        "string"
      );
      if (!baseDirectory.trim()) {
        throw new Error("Base directory cannot be empty");
      }
      const path = rivet.getInputOrData(data, inputData, "path", "string");
      if (!path.trim()) {
        throw new Error("Path cannot be empty");
      }
      if (path.includes("..")) {
        throw new Error("Path cannot contain '..'");
      }
      const contents = rivet.getInputOrData(
        data,
        inputData,
        "content",
        "string"
      );
      const { writeFile, join } = await import("../dist/nodeEntry.cjs");
      await writeFile(join(baseDirectory, path), contents);
      return {
        ["output"]: {
          type: "string",
          value: contents
        }
      };
    }
  };
  const nodeDefinition = rivet.pluginNodeDefinition(nodeImpl, "Write File");
  return nodeDefinition;
}

// src/index.ts
var initializer = (rivet) => {
  const shellCommand = ShellCommandNode_default(rivet);
  const writeFile = WriteFileNode_default(rivet);
  const plugin = {
    // The ID of your plugin should be unique across all plugins.
    id: "rivet-plugin-fs",
    // The name of the plugin is what is displayed in the Rivet UI.
    name: "Rivet Plugin FS",
    // Define all configuration settings in the configSpec object.
    configSpec: {},
    // Define any additional context menu groups your plugin adds here.
    contextMenuGroups: [
      {
        id: "fs",
        label: "FS"
      }
    ],
    // Register any additional nodes your plugin adds here. This is passed a `register`
    // function, which you can use to register your nodes.
    register: (register) => {
      register(shellCommand);
      register(writeFile);
    }
  };
  return plugin;
};
var src_default = initializer;
export {
  src_default as default
};
