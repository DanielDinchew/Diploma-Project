namespace Kanban.Models
{
    public class Column
    {
        public int Id { get; set; }
        public string Name { get; set; }
        // Navigation property
        public List<Task> Tasks { get; set; } = new List<Task>(); // Navigation property for Tasks
        public int BoardId { get; set; } // Foreign key
        public Board Board { get; set; } // Navigation property
                                         // You can add an Order property here if you want to manage the order of columns
    }
}
