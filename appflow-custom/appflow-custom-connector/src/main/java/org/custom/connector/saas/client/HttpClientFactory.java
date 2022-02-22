// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

package org.custom.connector.saas.client;

import com.amazonaws.appflow.custom.connector.model.credentials.Credentials;

public class HttpClientFactory implements AbstractFactory<HttpClient> {

  @Override
  public HttpClient create(final Credentials creds) {
    //Map<String, String> secrets = SecretsManagerHelper.getSecret(creds.secretArn());
    // String driver = secrets.getOrDefault("driver", null);

    // switch (driver) {
    //   case "mysql":
    //     return new MySQLClient(secrets);
    //   default:
    //     throw new NotImplementedException("JDBC Driver: " + driver + " is not yet implemented");
    // }
    return new HttpClient(creds);
  }
}
