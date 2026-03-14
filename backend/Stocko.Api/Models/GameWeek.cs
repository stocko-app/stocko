namespace Stocko.Api.Models;

public class GameWeek
{
    public Guid Id { get; set; }
    public DateOnly WeekStart { get; set; }   // sempre Segunda-feira
    public DateOnly WeekEnd { get; set; }     // sempre Sexta-feira
    public DateTime DraftDeadline { get; set; } // Segunda 08h00 Lisboa
    public DateTime ResultsAt { get; set; }     // Sexta 18h30 Lisboa
    public string Status { get; set; } = "draft_open"; // draft_open | in_progress | completed

    // Navegação
    public ICollection<Pick> Picks { get; set; } = new List<Pick>();
    public ICollection<WeeklyScore> WeeklyScores { get; set; } = new List<WeeklyScore>();
}