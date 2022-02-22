// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

package org.custom.connector.saas.config;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import com.amazonaws.appflow.custom.connector.model.connectorconfiguration.ConnectorModes;
import com.amazonaws.appflow.custom.connector.model.connectorconfiguration.auth.AuthenticationConfig;
import com.amazonaws.appflow.custom.connector.model.connectorconfiguration.auth.ImmutableAuthenticationConfig;
import com.amazonaws.appflow.custom.connector.model.settings.ConnectorRuntimeSetting;

public final class JDBCConnectorConfiguration {
  private JDBCConnectorConfiguration() {
  }

  public static List<ConnectorRuntimeSetting> getConnectorRuntimeSettings() {
    return null;
  }

  public static List<ConnectorModes> getConnectorModes() {
    return Arrays.asList(ConnectorModes.SOURCE, ConnectorModes.DESTINATION);
  }

  public static List<String> getSupportedApiVersions() {
    return Collections.singletonList("v1");
  }

  public static AuthenticationConfig getAuthenticationConfig() {

    return ImmutableAuthenticationConfig.builder()
        .isApiKeyAuthSupported(true)
        .isBasicAuthSupported(true)
        .build();
  }
}
