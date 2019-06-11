FROM mcr.microsoft.com/dotnet/core/sdk:2.2 AS build
WORKDIR /app

# copy csproj and restore as distinct layers
COPY Trip.Common/* ./Trip.Common/
COPY Trip.Infra/* ./Trip.Infra/
COPY Trip.Worker/* ./Trip.Worker/
WORKDIR /app/Trip.Worker
RUN dotnet restore
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/core/runtime:2.2 AS runtime
WORKDIR /app
COPY --from=build /app/Trip.Worker/out ./
ENTRYPOINT ["dotnet", "Trip.Worker.dll"]