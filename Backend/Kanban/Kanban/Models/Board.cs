using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace Kanban.Models
{
        public class Board
        {
            public int Id { get; set; }
            public string Name { get; set; }
            public int UserId { get; set; } // Foreign key
            public User User { get; set; } // Navigation property
            public List<Column> Columns { get; set; } = new List<Column>(); // Navigation property
        }
}
