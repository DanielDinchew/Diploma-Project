import PlusIcon from "../icons/PlusIcon";
import { useMemo, useState, useEffect } from "react";
import { Column, Id, /*Task*/ } from "../types";
import ColumnContainer from "./ColumnContainer";
import {
  DndContext,
  //DragEndEvent,
  //DragOverEvent,
  //DragOverlay,
  //DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, /*arrayMove*/ } from "@dnd-kit/sortable";
//import { createPortal } from "react-dom";
//import TaskCard from "./TaskCard";
import { useNavigate } from 'react-router-dom';

function KanbanBoard() {
  const navigate = useNavigate();

  const [columns, setColumns] = useState<Column[]>([]);

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  
  const [boardId, setBoardId] = useState<Id | null>(null);
  //const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  //const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      navigate('/login');
      return;
    }
  
    fetch('https://localhost:7296/api/board/GetUserBoard', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(boardData => {
      console.log(boardData);
      setBoardId(boardData.id);
      const columnsData = boardData.columns ? (boardData.columns.$values || boardData.columns) : [];
      setColumns(columnsData.map((column: { tasks: { $values: any; }; }) => ({
        ...column,
        tasks: column.tasks ? (column.tasks.$values || column.tasks) : []
      })));
    })
    .catch(error => {
      console.error("Failed to fetch: ", error);
      navigate('/login');
    });
  }, [navigate]);

  
  return (
    <div
      className="
        m-auto
        flex
        min-h-screen
        w-full
        items-center
        overflow-x-auto
        overflow-y-hidden
        px-[40px]
    "
    >
      <DndContext
        sensors={sensors}
        //onDragStart={onDragStart}
        //onDragEnd={onDragEnd}
        //onDragOver={onDragOver}
      >
        <div className="m-auto flex gap-4">
          <div className="flex gap-4">
            <SortableContext items={columnsId}>
              {columns.map((col) => (
                <ColumnContainer
                  key={col.id}
                  column={col}
                  boardId={boardId}
                  deleteColumn={deleteColumn}
                  updateColumn={updateColumn}
                  createTask={createTask}
                  deleteTask={deleteTask}
                  updateTask={updateTask}
                  //tasks={tasks.filter((task) => task.columnId === col.id)}
                />
              ))}
            </SortableContext>
          </div>
          <button
            onClick={() => {
              createNewColumn();
            }}
            className="
      h-[60px]
      w-[350px]
      min-w-[350px]
      cursor-pointer
      rounded-lg
      bg-mainBackgroundColor
      border-2
      border-columnBackgroundColor
      p-4
      ring-rose-500
      hover:ring-2
      flex
      gap-2
      "
          >
            <PlusIcon />
            Add Column
          </button>
        </div>
      </DndContext>
    </div>
  );

  function createTask(columnId: Id) {
    const authToken = localStorage.getItem('authToken');
    fetch('https://localhost:7296/api/board/AddTask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        columnId: columnId,
        // Here, include other task details as necessary
      }),
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((newTask) => {
      // Directly update columns state to include the new task in the correct column
      setColumns((prevColumns) => {
        // Ensure prevColumns is an array; if not, return it unchanged (or you could return an empty array or any other default value you see fit)
        if (!Array.isArray(prevColumns)) return prevColumns; // or return [] or any other default value
  
        return prevColumns.map((column) => {
          if (column.id === columnId) {
            return {
              ...column,
              tasks : Array.isArray(column.tasks) ? [...column.tasks, newTask] : [newTask]
            };
          }
          return column; // Return all other columns unchanged
        });
      });
    })
    .catch((error) => {
      console.error('Error creating task:', error);
    });
  }
  

  function deleteTask(id: Id) {
    const authToken = localStorage.getItem('authToken');
    fetch(`https://localhost:7296/api/board/DeleteTask/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      setColumns((prevColumns) => prevColumns.map((column) => {
        return {
          ...column,
          tasks: column.tasks.filter((task) => task.id !== id)
        };
      }));
    })
    .catch((error) => {
      console.error('Error deleting task:', error);
    });
  }
  
  function updateTask(id: Id, description: string) {
    const authToken = localStorage.getItem('authToken');
    fetch(`https://localhost:7296/api/board/UpdateTask/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        description: description,
      }),
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      setColumns((prevColumns) => prevColumns.map((column) => {
        return {
          ...column,
          tasks: column.tasks.map((task) => task.id === id ? { ...task, description } : task)
        };
      }));
    })
    .catch((error) => {
      console.error('Error updating task:', error);
    });
  }
  

  async function createNewColumn() {
    const columnName = `Column ${columns.length + 1}`; // Generate a new column title

    if (boardId === null) {
      console.error('Board ID is null, cannot create new column.');
      return;
  }

    // Prepare the column data to send in the request body
    const columnData = {
        name: columnName,
        BoardId: boardId,
    };

    try {
        const response = await fetch('https://localhost:7296/api/board/AddColumn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
            },
            body: JSON.stringify(columnData),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const newColumn = await response.json(); // Assuming newColumn matches the expected structure

        setColumns(prevColumns => [...prevColumns, newColumn]);

    } catch (error) {
        console.error('Error adding new column:', error);
    }
}




async function deleteColumn(columnId: Id) {
  try {
    const response = await fetch(`https://localhost:7296/api/board/DeleteColumn/${columnId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    // Assuming deletion was successful, update the local state directly
    setColumns((prevColumns) => {
      return prevColumns.filter(column => column.id !== columnId);
    });

  } catch (error) {
    console.error('Error deleting column:', error);
  }
}

async function updateColumn(id: Id, newName: string) {
  // Prepare column data for the update
  const columnData = { name: newName };

  try {
    const response = await fetch(`https://localhost:7296/api/board/UpdateNameColumn?columnId=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(columnData),
    });

    if (!response.ok) {
      throw new Error('Failed to update column');
    }

    // Assuming your backend returns the updated column, you can directly use it to update state
    const updatedColumn = await response.json();

    setColumns((prevColumns) => {
      // Update the columns state by mapping over them and replacing the one that matches the ID
      return prevColumns.map((column) => column.id === id ? updatedColumn : column);
    });
  } catch (error) {
    console.error('Error updating column:', error);
  }
}

  /*function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }

    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAColumn = active.data.current?.type === "Column";
    if (!isActiveAColumn) return;

    console.log("DRAG END");

    setColumns((columns) => {
      const activeColumnIndex = columns.findIndex((col) => col.id === activeId);

      const overColumnIndex = columns.findIndex((col) => col.id === overId);

      return arrayMove(columns, activeColumnIndex, overColumnIndex);
    });
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    const isOverATask = over.data.current?.type === "Task";

    if (!isActiveATask) return;

    // Im dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        if (tasks[activeIndex].columnId != tasks[overIndex].columnId) {
          // Fix introduced after video recording
          tasks[activeIndex].columnId = tasks[overIndex].columnId;
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    const isOverAColumn = over.data.current?.type === "Column";

    // Im dropping a Task over a column
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);

        tasks[activeIndex].columnId = overId;
        console.log("DROPPING TASK OVER COLUMN", { activeIndex });
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }
  }*/
}

export default KanbanBoard;