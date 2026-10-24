using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace GlycemieApi.Tests;

/// <summary>
/// Démarre l'API en mémoire, en configuration Production, avec une base volontairement injoignable :
/// on vérifie le comportement attendu par les sondes Kubernetes et l'absence de redirection https.
/// </summary>
public class HealthEndpointsTests(HealthEndpointsTests.ApiFactory factory) : IClassFixture<HealthEndpointsTests.ApiFactory>
{
    public class ApiFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Production");
            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                // Port 1 : rien n'écoute, l'échec est immédiat.
                ["Mongo:ConnectionString"] = "mongodb://127.0.0.1:1/?serverSelectionTimeoutMS=500&connectTimeoutMS=500",
                ["Jwt:Secret"] = "cle-de-test-uniquement-0123456789-abcdefghij",
            }));
        }
    }

    private readonly HttpClient _client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

    [Fact]
    public async Task Live_returns_200_even_when_database_is_down()
    {
        var response = await _client.GetAsync("/health/live");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Ready_returns_503_when_database_is_down()
    {
        var response = await _client.GetAsync("/health/ready");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task Http_request_is_not_redirected_to_https()
    {
        // Derrière l'ingress, le pod reçoit du http : une redirection bouclerait.
        var request = new HttpRequestMessage(HttpMethod.Get, "http://localhost/health/live");
        request.Headers.Add("X-Forwarded-Proto", "https");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Protected_routes_still_require_a_token()
    {
        var response = await _client.GetAsync("/api/readings");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
