import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  For,
  ParentComponent,
  useContext,
  type Component,
} from "solid-js";
import { createStore, SetStoreFunction, unwrap } from "solid-js/store";

type Task = {
  id: string;
  text: string;
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
      class="min-w-full rounded-md bg-sky-500 p-2 text-white shadow-md transition-all hover:bg-sky-600 hover:shadow-lg sm:min-w-min"
      onclick={props.onClick}
    >
      {props.children}
    </button>
  );
};

const Task: Component<{ task: Task }> = (props) => {
  const { state, setState } = useContext(StateContext);

  const deleteTask = () => {
    setState(
      "tasks",
      state.tasks.filter((task) => task.id != props.task.id),
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

  return (
    <div class="flex rounded-md bg-slate-100 p-2 shadow-md outline-none outline-offset-2 transition-all has-[:focus]:shadow-lg has-[:focus]:outline-2 has-[:focus]:outline-sky-300">
      <input
        class="h-min flex-1 resize-none bg-inherit outline-none selection:bg-sky-300"
        value={props.task.text}
        onChange={(e) => updateTask(e.target.value)}
      />
      <button
        class="rounded-md px-1 transition-all hover:text-red-600"
        onClick={deleteTask}
      >
        <i class="bi bi-trash3"></i>
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
              class="min-w-full flex-1 rounded-md p-2 shadow-md outline-none transition-all selection:bg-sky-300 focus:shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-300 sm:min-w-min"
              value={text()}
              onInput={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key == "Enter") {
                  addItem();
                }
              }}
            />
            <Button onClick={addItem}>
              <i class="bi bi-plus-lg"></i>
              Add
            </Button>
          </div>

          <For each={state.tasks}>{(item, index) => <Task task={item} />}</For>
        </div>
      </div>
    </StateContext.Provider>
  );
};

export default App;
