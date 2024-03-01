namespace Kanban.Models
{
    public class Task
    {
        public int Id { get; set; }
        public string description { get; set; }
        // You can add additional fields such as status, priority, due date, etc.

        // Foreign key for Column
        public int ColumnId { get; set; }
        public Column Column { get; set; } // Navigation property
    }
}
