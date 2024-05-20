import PlusIcon from "../icons/PlusIcon";
import { useMemo, useState, useEffect } from "react";
import { Column, Id, Task } from "../types";
import ColumnContainer from "./ColumnContainer";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { useNavigate } from 'react-router-dom';
import TaskCard from "./TaskCard";

function KanbanBoard() {
  const navigate = useNavigate();

  const [columns, setColumns] = useState<Column[]>([]);

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const [boardId, setBoardId] = useState<Id | null>(null);

  const [activeColumn, setActiveColumn] = useState<Column | null>(null);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

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
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
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
          {createPortal(
            <DragOverlay>
              {activeColumn && (
                <ColumnContainer
                  column={activeColumn}
                  deleteColumn={deleteColumn}
                  updateColumn={updateColumn}
                  boardId={boardId}
                  createTask={createTask}
                  deleteTask={deleteTask}
                  updateTask={updateTask}
                />
              )}
              {activeTask && (
                <TaskCard
                  task={activeTask}
                  deleteTask={deleteTask}
                  updateTask={updateTask}
                />
              )}
            </DragOverlay>,
            document.body
          )}
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
        setColumns((prevColumns: Column[]) => {
          return prevColumns.map((column) => {
            if (column.id === columnId) {
              return {
                ...column,
                tasks: Array.isArray(column.tasks) ? [...column.tasks, newTask] : [newTask]
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

      const newColumn = await response.json(); 
      const newColumnWithTasks = { ...newColumn, tasks: [] };
      setColumns(prevColumns => [...prevColumns, newColumnWithTasks]);

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


  function onDragStart(event: DragStartEvent) {
    const currentItem = event.active.data.current;

    if (!currentItem) return; // Exit if currentItem is undefined or null

    if (currentItem.type === "Column") {
      // Directly use the column
      setActiveColumn(currentItem.column);
      return;
    }

    if (currentItem.type === "Task") {
      const { id, columnId } = currentItem.task;
      const column = columns.find(c => c.id === columnId);
      console.log(currentItem);
      if (!column) {
        console.log('Column not found');
        return;
      }

      const task = column.tasks.find(t => t.id === id);
      console.log(task, id);
      if (!task) {
        console.log('Task not found');
        return;
      }
      setActiveTask(task);
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveTask(null);
    const authToken = localStorage.getItem('authToken');

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeItem = active.data.current;
    const overItem = over.data.current;

    if (!activeItem || !overItem) return;
    // Handle column reordering
    if (activeItem.type === "Column" && overItem.type === "Column") {
      setColumns((columns) => {
        const activeColumnIndex = columns.findIndex((col) => col.id === activeId);
        const overColumnIndex = columns.findIndex((col) => col.id === overId);

        return arrayMove(columns, activeColumnIndex, overColumnIndex);
      });
      return; // Exit after handling columns
    }

    // Handle task reordering or moving
    if (activeItem.type === "Task") {
      setColumns((columns) => {
        let newColumns = [...columns];
        let task = null;

        // Remove the task from its original column
        for (const column of newColumns) {
          task = column.tasks.find(t => t.id === activeId);
          if (task) {
            column.tasks = column.tasks.filter(t => t.id !== activeId);
            break;
          }
        }

        if (!task) return columns; // If the task wasn't found, return the columns unmodified

        // If the task is dropped on a column, add it to the column
        if (overItem.type === "Column") {
          const targetColumn = newColumns.find(c => c.id === overId);
          if (targetColumn) {
            task.columnId = overId; // Update task's columnId
            fetch(`https://localhost:7296/api/board/UpdateTask/${task.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({
                ColumnId: overId,
              }),
            })
            targetColumn.tasks.push(task);
          }
        }
        // If the task is dropped on another task, add it above that task
        else if (overItem.type === "Task") {
          const targetColumn = newColumns.find(c => c.tasks.some(t => t.id === overId));
          if (targetColumn) {
            task.columnId = targetColumn.id; // Update task's columnId
            fetch(`https://localhost:7296/api/board/UpdateTask/${task.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({
                ColumnId: targetColumn.id,
              }),
            })
            const index = targetColumn.tasks.findIndex(t => t.id === overId);
            targetColumn.tasks.splice(index, 0, task);
          }
        }

        return newColumns;
      });
    }
  }


  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    console.log(over.id);
    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    const isOverATask = over.data.current?.type === "Task";

    if (!isActiveATask || !isOverATask) return;

    // Assuming 'columns' is your array of columns and each column has an 'id' and 'tasks' array
    setColumns((columns) => {
      let activeTask: Task | undefined;
      let overTask: Task | undefined;
      let activeColumnIndex: number = -1;
      let overColumnIndex: number = -1;

      // Find the tasks and their column indices
      columns.forEach((column, index) => {
        column.tasks.forEach((task) => {
          if (task.id === activeId) {
            activeTask = task;
            activeColumnIndex = index;
          } else if (task.id === overId) {
            overTask = task;
            overColumnIndex = index;
          }
        });
      });

      if (!activeTask || !overTask) return columns; // If either task wasn't found, just return

      if (activeTask.columnId !== overTask.columnId) {
        // Clone columns to avoid directly mutating state
        const newColumns = JSON.parse(JSON.stringify(columns));

        if (activeColumnIndex === -1 || overColumnIndex === -1) return columns;

        // Remove the active task from its original column
        newColumns[activeColumnIndex].tasks = newColumns[activeColumnIndex].tasks.filter((task: Task) => task.id !== activeId);


        // Update the active task's columnId to match the over task's columnId
        activeTask.columnId = overTask.columnId;

        // Add the active task to the over task's column
        newColumns[overColumnIndex].tasks.push(activeTask);

        return newColumns;
      }

      // If the column IDs match or no updates are necessary, just return the original columns
      return columns;
    });


    const isOverAColumn = over.data.current?.type === "Column";

    if (isActiveATask && isOverAColumn) {
      setColumns((currentColumns) => {
        // Deep copy to avoid direct state mutation
        const newColumns = JSON.parse(JSON.stringify(currentColumns));

        // Find and remove the active task from its current column
        let activeTask: Task | undefined;
        newColumns.forEach((column: Column) => {
          const taskIndex = column.tasks.findIndex((task: Task) => task.id === activeId);
          if (taskIndex > -1) {
            activeTask = column.tasks.splice(taskIndex, 1)[0] as Task;
          }
        });

        if (!activeTask) {
          console.log("Active task not found");
          return newColumns; // Return early if the active task wasn't found
        }

        // Update the active task's columnId to the new column's ID
        activeTask.columnId = overId;

        // Add the active task to the new column
        const targetColumnIndex = newColumns.findIndex((column: Column) => column.id === overId);
        if (targetColumnIndex > -1) {
          newColumns[targetColumnIndex].tasks.push(activeTask);
        } else {
          console.log("Target column not found");
        }
        return newColumns;
      });
    }

  }
}

export default KanbanBoard;