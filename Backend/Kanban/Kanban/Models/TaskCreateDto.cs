namespace Kanban.Models
{
    public class TaskCreateDto
    {
        public string description { get; set; } = "New Task";
        public int ColumnId { get; set; }
    }
}
