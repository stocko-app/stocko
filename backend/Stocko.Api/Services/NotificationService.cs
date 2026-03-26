using System.Text;
using System.Text.Json;
using Stocko.Api.Data;

namespace Stocko.Api.Services;

public class NotificationService
{
    private readonly HttpClient _http;
    private readonly StockoDbContext _db;

    public NotificationService(HttpClient http, StockoDbContext db)
    {
        _http = http;
        _db = db;
    }

    // Enviar notificação para um utilizador
    public async Task SendToUserAsync(Guid userId, string title, string body, object? data = null)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user?.ExpoPushToken == null) return;

        await SendAsync(user.ExpoPushToken, title, body, data);
    }

    // Enviar notificação para múltiplos utilizadores
    public async Task SendToUsersAsync(List<Guid> userIds, string title, string body, object? data = null)
    {
        var tokens = _db.Users
            .Where(u => userIds.Contains(u.Id) && u.ExpoPushToken != null)
            .Select(u => u.ExpoPushToken!)
            .ToList();

        foreach (var batch in tokens.Chunk(100))
        {
            await SendBatchAsync(batch.ToList(), title, body, data);
        }
    }

    // Enviar para todos os utilizadores activos
    public async Task SendToAllAsync(string title, string body, object? data = null)
    {
        var tokens = _db.Users
            .Where(u => u.ExpoPushToken != null)
            .Select(u => u.ExpoPushToken!)
            .ToList();

        foreach (var batch in tokens.Chunk(100))
        {
            await SendBatchAsync(batch.ToList(), title, body, data);
        }
    }

    // Notificação de resultado semanal
    public async Task SendWeeklyResultAsync(Guid userId, int rank, decimal points, int totalPlayers)
    {
        var percentile = totalPlayers > 0
            ? (int)Math.Round((decimal)(totalPlayers - rank) / totalPlayers * 100)
            : 0;

        var title = "Resultado Semanal 🏆";
        var body = $"Ficaste #{rank} de {totalPlayers} jogadores ({points:F1} pts) — top {percentile}%!";

        await SendToUserAsync(userId, title, body, new { screen = "Rankings" });
    }

    // Notificação de deadline
    public async Task SendDeadlineReminderAsync()
    {
        // Só para quem NÃO fez picks esta semana
        var gameWeekService = new GameWeekService(_db);
        var currentWeek = gameWeekService.GetOrCreateCurrentWeek();

        var usersWithPicks = _db.Picks
            .Where(p => p.GameWeekId == currentWeek.Id)
            .Select(p => p.UserId)
            .Distinct()
            .ToList();

        var usersWithoutPicks = _db.Users
            .Where(u => !usersWithPicks.Contains(u.Id) && u.ExpoPushToken != null)
            .Select(u => u.Id)
            .ToList();

        if (!usersWithoutPicks.Any()) return;

        await SendToUsersAsync(
            usersWithoutPicks,
            "Deadline em 2 horas ⏰",
            "Ainda não escolheste os teus picks desta semana. Faltam 2 horas!",
            new { screen = "Draft" }
        );

        Console.WriteLine($"✅ Deadline reminder enviado para {usersWithoutPicks.Count} utilizadores");
    }

    // Notificação de capitão disponível
    public async Task SendCaptainReminderAsync()
    {
        var gameWeekService = new GameWeekService(_db);
        var currentWeek = gameWeekService.GetOrCreateCurrentWeek();

        // Utilizadores com picks mas sem capitão activado
        var usersWithPicks = _db.Picks
            .Where(p => p.GameWeekId == currentWeek.Id && !p.IsAuto)
            .Select(p => p.UserId)
            .Distinct()
            .ToList();

        var usersWithCaptain = _db.Picks
            .Where(p => p.GameWeekId == currentWeek.Id && p.CaptainActivatedDay != null)
            .Select(p => p.UserId)
            .Distinct()
            .ToList();

        var usersNeedingCaptain = usersWithPicks
            .Where(u => !usersWithCaptain.Contains(u))
            .ToList();

        if (!usersNeedingCaptain.Any()) return;

        await SendToUsersAsync(
            usersNeedingCaptain,
            "Capitão disponível ⭐",
            "O teu capitão ainda está disponível. Escolhe bem o dia!",
            new { screen = "Home" }
        );

        Console.WriteLine($"✅ Captain reminder enviado para {usersNeedingCaptain.Count} utilizadores");
    }

    // Notificação de nova conquista
    public async Task SendAchievementAsync(Guid userId, string achievementType)
    {
        var descriptions = new Dictionary<string, string>
        {
            { "first_week", "Completaste a tua primeira semana! 🎉" },
            { "streak_4", "4 semanas seguidas! Estás viciado! 🔥" },
            { "streak_8", "8 semanas seguidas! Incrível! 🔥🔥" },
            { "streak_12", "12 semanas seguidas! Lenda! 🔥🔥🔥" },
            { "top_10pct", "Estás no top 10% global! 🏅" },
            { "top_1pct", "Top 1% global! És elite! 🥇" },
            { "weekly_champion", "Campeão semanal! 🏆" },
            { "league_founder", "Criaste a tua primeira liga! 🏰" },
            { "tier_promoted", "Subiste de liga! 🎊" },
        };

        var desc = descriptions.GetValueOrDefault(achievementType, "Novo badge desbloqueado!");

        await SendToUserAsync(
            userId,
            "Novo Badge Desbloqueado! 🏅",
            desc,
            new { screen = "Profile", achievement = achievementType }
        );
    }

    // Notificação de streak em risco
    public async Task SendStreakRiskAsync(Guid userId, int streakWeeks)
    {
        await SendToUserAsync(
            userId,
            $"Streak de {streakWeeks} semanas em risco! 🔥",
            "O draft abre Segunda às 08h00. Não percas a sequência!",
            new { screen = "Draft" }
        );
    }

    // Notificação de auto-pick confirmado
    public async Task SendAutoPickConfirmationAsync(Guid userId, int streakWeeks)
    {
        await SendToUserAsync(
            userId,
            "Auto-pick aplicado 🤖",
            $"Aplicámos os teus picks da semana passada automaticamente. Streak de {streakWeeks} semanas mantido!",
            new { screen = "Home" }
        );
    }

    // Notificação de capitão auto-aplicado
    public async Task SendAutoCaptainAsync(Guid userId, string ticker)
    {
        await SendToUserAsync(
            userId,
            "Capitão aplicado automaticamente ⭐",
            $"Capitão aplicado automaticamente a {ticker}. Veremos como corre hoje!",
            new { screen = "Home" }
        );
    }

    // Notificação de promoção de tier
    public async Task SendTierPromotionAsync(Guid userId, string newTier)
    {
        var tierNames = new Dictionary<string, string>
        {
            { "silver", "Prata 🥈" },
            { "gold", "Ouro 🥇" },
            { "platinum", "Platina 💎" },
            { "diamond", "Diamante 💠" },
            { "elite", "Elite 👑" }
        };

        var tierName = tierNames.GetValueOrDefault(newTier, newTier);

        await SendToUserAsync(
            userId,
            $"Subiste para {tierName}!",
            "A competição vai ser mais dura — estás preparado? 🎉",
            new { screen = "Rankings" }
        );
    }

    // ── MÉTODOS INTERNOS ──────────────────────────────────────────────

    private async Task SendAsync(string token, string title, string body, object? data = null)
    {
        await SendBatchAsync(new List<string> { token }, title, body, data);
    }

    private async Task SendBatchAsync(List<string> tokens, string title, string body, object? data = null)
    {
        try
        {
            var messages = tokens.Select(token => new
            {
                to = token,
                title,
                body,
                data = data ?? new { },
                sound = "default"
            }).ToList();

            var json = JsonSerializer.Serialize(messages);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.PostAsync("https://exp.host/--/api/v2/push/send", content);

            if (response.IsSuccessStatusCode)
                Console.WriteLine($"✅ {tokens.Count} notificações enviadas");
            else
                Console.WriteLine($"❌ Erro ao enviar notificações: {response.StatusCode}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Excepção ao enviar notificações: {ex.Message}");
        }
    }
}