package org.custom.connector.saas.client;

import com.amazonaws.appflow.custom.connector.model.credentials.Credentials;
import com.amazonaws.appflow.custom.connector.model.metadata.DescribeEntityRequest;
import com.amazonaws.appflow.custom.connector.model.metadata.Entity;
import com.amazonaws.appflow.custom.connector.model.metadata.FieldDataType;
import com.amazonaws.appflow.custom.connector.model.metadata.FieldDefinition;
import com.amazonaws.appflow.custom.connector.model.metadata.ImmutableEntity;
import com.amazonaws.appflow.custom.connector.model.metadata.ImmutableFieldDefinition;
import com.amazonaws.appflow.custom.connector.model.metadata.ImmutableReadOperationProperty;
import com.amazonaws.appflow.custom.connector.model.metadata.ListEntitiesRequest;
import com.amazonaws.appflow.custom.connector.model.query.QueryDataRequest;
import com.amazonaws.appflow.custom.connector.model.write.WriteDataRequest;
import com.amazonaws.appflow.custom.connector.model.write.WriteOperationType;

import org.apache.http.Header;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPatch;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.client.methods.HttpRequestBase;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Objects;
import java.util.ArrayList;

/**
 * Implementation for HttpClient.
 */
public class HttpClient implements IHttpClient {
    private static final Logger LOGGER = LoggerFactory.getLogger(HttpClient.class);
    private static final int TEN_MINUTE_MS = 600000;
    private static final int SOCKET_TIMEOUT_MS = TEN_MINUTE_MS;
    private static final int CONNECTION_TIMEOUT_MS = 30000;
    private static final int REQUEST_TIMEOUT_MS = TEN_MINUTE_MS;
    private static final RequestConfig REQUEST_CONFIG = RequestConfig.custom()
            .setConnectionRequestTimeout(REQUEST_TIMEOUT_MS)
            .setConnectTimeout(CONNECTION_TIMEOUT_MS)
            .setSocketTimeout(SOCKET_TIMEOUT_MS)
            .build();

    private final CloseableHttpClient httpClient;
    // private final String accessToken;
    private final Credentials credentials;

    public HttpClient(final Credentials credentials) {
        // public HttpClient() {
        this.credentials = credentials;
        this.httpClient = HttpClientBuilder.create()
                .setDefaultRequestConfig(REQUEST_CONFIG)
                .setSSLHostnameVerifier(NoopHostnameVerifier.INSTANCE)
                .build();
    }

    public String restGet(final String requestUri) {
        final URI uri = URI.create(requestUri);
        final HttpGet getRequest = new HttpGet(uri);
        addAuthorizationHeader(getRequest);
        return execute(getRequest);
    }

    private String execute(final HttpUriRequest request) {
        try {
            final CloseableHttpResponse httpResponse = this.httpClient.execute(request);
            final int statusCode = httpResponse.getStatusLine().getStatusCode();
            final String response = Objects.isNull(httpResponse.getEntity()) ? null
                    : EntityUtils.toString(httpResponse.getEntity(), StandardCharsets.UTF_8);
            LOGGER.info(response);
            final String reason = httpResponse.getStatusLine().getReasonPhrase();
            LOGGER.info(reason);
            return response;
        } catch (IOException ex) {
            throw new RuntimeException(ex);
        }
    }

    private void addAuthorizationHeader(final HttpRequestBase requestBase) {
        requestBase.addHeader("Authorization", "Bearer "); // + this.accessToken);
    }

    @Override
    public List<WriteOperationType> getWriteOperations() {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public List<Entity> getEntities(ListEntitiesRequest request) throws SQLException {
        final List<Entity> records = new ArrayList<Entity>();

        records.add(
                ImmutableEntity.builder()
                        .entityIdentifier("Expenses")
                        .description("Expenses")
                        .label("Expenses")
                        .hasNestedEntities(false)
                        .build());

        return records;
    }

    @Override
    public List<FieldDefinition> getFieldDefinitions(DescribeEntityRequest request) throws SQLException {
        final List<FieldDefinition> fieldDefinitions = new ArrayList<>();

        // "date": "2022-02-13T22:28:51.020Z",
        // "fileName": "1-supplies.jpeg",
        // "imageUrl": "Placeholder for Image URL",
        // "status": "Complete",
        // "amount": "55.64",
        // "description": "Catering",
        // "id": "00520b65-7c54-42c4-b498-abd6ae236c01",
        // "vendor": "WHOLE\nFOODS\nMARKET"
        var fields = List.of("date", "status", "amount", "vendor");

        for (String string : fields) {
            fieldDefinitions.add(ImmutableFieldDefinition.builder()
                    .fieldName(string)
                    .dataType(FieldDataType.String)
                    .dataTypeLabel(string)
                    .label(string)
                    .isPrimaryKey(false)
                    .readProperties(ImmutableReadOperationProperty.builder()
                            .isQueryable(true)
                            .isRetrievable(true)
                            .build())
                    .build());
        }

        fieldDefinitions.add(ImmutableFieldDefinition.builder()
                .fieldName("id")
                .dataType(FieldDataType.String)
                .dataTypeLabel("id")
                .label("id")
                .isPrimaryKey(true)
                .readProperties(ImmutableReadOperationProperty.builder()
                        .isQueryable(true)
                        .isRetrievable(true)
                        .build())
                .build());

        return fieldDefinitions;
    }

    @Override
    public Connection getConnection() throws SQLException {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public long getTotalData(QueryDataRequest request) throws SQLException {
        // TODO Auto-generated method stub
        return 0;
    }

    @Override
    public List<String> queryData(QueryDataRequest request) throws SQLException {
        List<String> records = new ArrayList<String>();

        String query = restGet("https://fvn45c37l2.execute-api.ap-southeast-2.amazonaws.com/prod/export");
        LOGGER.error(query);
        // Expense expense = new Expense();
        // expense.setId("id1");
        // expense.setDate("2022-02-13T22:28:51.020Z");
        // expense.setStatus("COMPLETE");
        // expense.setAmount("100");
        // expense.setVendor("VENDOR");

        ObjectMapper mapper = new ObjectMapper();
        // try {
        // String json = mapper.writeValueAsString(expense);
        // LOGGER.info("ResultingJSONstring = " + json);
        // records.add(json);
        // } catch (JsonProcessingException e) {
        // LOGGER.error("Error =" + e);
        // }
        try {
            var expenses = mapper.readValue(query, Expense[].class);
            for (Expense exp : expenses) {
                String json = mapper.writeValueAsString(exp);
                LOGGER.info("ResultingJSONstring = " + json);
                records.add(json);
            }
        } catch (JsonProcessingException e) {
            LOGGER.error("Error =" + e);
        }

        return records;

    }

    @Override
    public int[] writeData(WriteDataRequest request) throws SQLException {
        // TODO Auto-generated method stub
        return null;
    }

    static class Expense {
        private String id;
        private String date;
        private String status;
        private String amount;
        private String vendor;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getAmount() {
            return amount;
        }

        public void setAmount(String amount) {
            this.amount = amount;
        }

        public String getVendor() {
            return vendor;
        }

        public void setVendor(String vendor) {
            this.vendor = vendor;
        }

    }
}
