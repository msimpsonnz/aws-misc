FROM mcr.microsoft.com/dotnet/core/aspnet:3.1 AS build-env
WORKDIR /app

COPY ./src/*.csproj ./
RUN dotnet restore

COPY ./src/ ./
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/core/aspnet:3.1
WORKDIR /app

COPY --from=build-env /app/out .
EXPOSE 80

ENTRYPOINT ["dotnet", "IdentityServer4Demo.dll"]