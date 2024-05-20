namespace Kanban.Models
{
    public class TaskUpdateDto
    {
        public string? description { get; set; }
        public int? ColumnId { get; set; }
    }
}
