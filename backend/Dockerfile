# --- Compilation ---
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restauration séparée : la couche reste en cache tant que le .csproj ne change pas.
COPY src/GlycemieApi/GlycemieApi.csproj src/GlycemieApi/
RUN dotnet restore src/GlycemieApi/GlycemieApi.csproj

COPY src/ src/
RUN dotnet publish src/GlycemieApi -c Release -o /app --no-restore /p:UseAppHost=false

# --- Exécution ---
# Image « chiseled » : ni shell ni gestionnaire de paquets, utilisateur non root par défaut.
FROM mcr.microsoft.com/dotnet/aspnet:8.0-noble-chiseled AS runtime
WORKDIR /app
COPY --from=build /app .

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER $APP_UID

ENTRYPOINT ["dotnet", "GlycemieApi.dll"]
