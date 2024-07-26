import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  For,
  ParentComponent,
  Show,
  useContext,
  type Component,
} from "solid-js";
import { createStore, SetStoreFunction, unwrap } from "solid-js/store";
import { Portal } from "solid-js/web";

type Task = {
  id: string;
  text: string;
  completed?: boolean;
};

type State = {
  tasks: Task[];
};

type StateContextType = {
  state: State;
  setState: SetStoreFunction<State>;
};
const StateContext = createContext<StateContextType>({
  // default value
  state: {
    tasks: [],
  },
  setState: () => {},
});

const Button: ParentComponent<{ onClick: () => void }> = (props) => {
  return (
    <button
      class="min-w-full rounded-md bg-sky-500 p-2 font-bold text-white shadow-sm transition-all hover:bg-sky-600 hover:shadow-md sm:min-w-min"
      onclick={props.onClick}
    >
      {props.children}
    </button>
  );
};

const DeleteTaskButton: Component<{ task: Task }> = (props) => {
  const { state, setState } = useContext(StateContext);

  const deleteTask = () => {
    setState(
      "tasks",
      state.tasks.filter((task) => task.id != props.task.id),
    );

    setShowPopup(false);
  };

  const [showPopup, setShowPopup] = createSignal(false);

  let cancelRef: HTMLButtonElement | undefined;

  createEffect(() => {
    if (showPopup() && cancelRef) {
      cancelRef.focus();
      console.log("ping");
    }
  });

  return (
    <>
      <button
        class="rounded-md px-1 transition-all hover:text-red-600"
        onClick={() => {
          setShowPopup(true);
        }}
      >
        <i class="bi bi-trash3"></i>
      </button>
      <Show when={showPopup()}>
        <Portal>
          <div class="fixed left-0 top-0 h-screen w-screen bg-black bg-opacity-30">
            <div class="relative inset-1/2 w-max -translate-x-1/2 -translate-y-1/2 rounded-md bg-slate-100 p-2 shadow-md">
              <div class="p-2 pb-4 text-center text-lg">Delete task?</div>
              <div class="flex gap-2">
                <button
                  class="rounded-md border border-slate-500 p-2 shadow-sm transition-all hover:bg-slate-500 hover:text-white hover:shadow-md"
                  ref={cancelRef}
                  onClick={() => setShowPopup(false)}
                >
                  Cancel
                </button>
                <button
                  class="rounded-md bg-red-500 p-2 font-bold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md"
                  onClick={deleteTask}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </Portal>
      </Show>
    </>
  );
};

const Task: Component<{ task: Task }> = (props) => {
  const { state, setState } = useContext(StateContext);

  const check = () => {
    setState(
      "tasks",
      state.tasks.map((task) => {
        if (task.id == props.task.id) {
          return {
            ...task,
            completed: !task.completed,
          };
        }

        return task;
      }),
    );
  };

  const updateTask = (text: string) => {
    console.log(text);
    setState(
      "tasks",
      state.tasks.map((task) => {
        if (task.id == props.task.id) {
          return {
            ...task,
            text: text,
          };
        }

        return task;
      }),
    );
  };

  const [draggable, setDraggable] = createSignal(false);

  const onDragStart = (e: DragEvent) => {
    console.log(`dragging ${props.task.text}`);

    setDraggable(false);

    e.dataTransfer?.setData("task-id", props.task.id);
  };

  const onDragOver = (e: DragEvent) => {
    console.log(e.dataTransfer?.getData("task-id"));

    const id = e.dataTransfer?.getData("task-id");
    if (id) {
      e.preventDefault();

      // insert in current task's position
      const droppedTaskIndex = state.tasks.findIndex((task) => task.id == id);
      const droppedTask = state.tasks.find((task) => task.id == id);

      if (droppedTask) {
        const tasks = state.tasks.filter((task) => task != droppedTask);
        const thisTaskIndex = tasks.findIndex(
          (task) => task.id == props.task.id,
        );

        const before = droppedTaskIndex > thisTaskIndex;

        if (thisTaskIndex != -1) {
          setState(
            "tasks",
            tasks.toSpliced(
              before ? thisTaskIndex : thisTaskIndex + 1,
              0,
              droppedTask,
            ),
          );
        }
      }
    }
  };

  return (
    <div
      class={`flex rounded-md p-2 shadow-sm outline-none outline-offset-2 transition-all hover:shadow-md has-[:focus]:shadow-lg has-[:focus]:outline-2 has-[:focus]:outline-sky-300 ${props.task.completed ? "bg-green-100" : "bg-slate-100"}`}
      draggable={draggable()}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={(e) => {
        console.log("dropped");
        e.preventDefault();
      }}
    >
      <input
        class={`h-min flex-1 resize-none bg-inherit outline-none selection:bg-sky-300 ${props.task.completed ? "line-through" : ""}`}
        value={props.task.text}
        onChange={(e) => updateTask(e.target.value)}
      />
      <button
        class="rounded-md px-1 transition-all hover:text-green-600"
        onClick={check}
      >
        <i class="bi bi-check-lg"></i>
      </button>
      <DeleteTaskButton task={props.task} />
      <button
        class="rounded-md px-1 transition-all hover:text-sky-600"
        onMouseDown={() => setDraggable(true)}
        onMouseUp={() => setDraggable(false)}
      >
        <i class="bi bi-grip-vertical"></i>
      </button>
    </div>
  );
};

const App: Component = () => {
  var initialState: State = {
    tasks: [],
  };

  try {
    const localStateString = localStorage.getItem("state");
    if (localStateString != null) {
      initialState = JSON.parse(localStateString);
    }
  } catch (error) {
    console.log(error);
  }

  const [state, setState] = createStore<State>(initialState);

  createEffect(() => {
    const stateString = JSON.stringify(state);

    localStorage.setItem("state", stateString);
    console.log(stateString);
  });

  const [text, setText] = createSignal("");

  const addItem = () => {
    if (text().length > 0) {
      setState("tasks", [
        {
          id: crypto.randomUUID(),
          text: text(),
        },
        ...state.tasks,
      ]);
      setText("");
    }
  };

  return (
    <StateContext.Provider value={{ state, setState }}>
      <div class="flex h-screen justify-center bg-slate-200 p-2">
        <div class="flex max-w-screen-md flex-1 flex-col gap-2">
          <div class="flex flex-wrap justify-center gap-2">
            <input
              class="min-w-full flex-1 rounded-md p-2 shadow-sm outline-none transition-all selection:bg-sky-300 hover:shadow-md focus:shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-300 sm:min-w-min"
              value={text()}
              onInput={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key == "Enter") {
                  addItem();
                }
              }}
            />
            <Button onClick={addItem}>
              <i class="bi bi-plus-lg pr-1"></i>
              Add
            </Button>
          </div>

          <For each={state.tasks}>{(task) => <Task task={task} />}</For>
        </div>
      </div>
    </StateContext.Provider>
  );
};

export default App;
