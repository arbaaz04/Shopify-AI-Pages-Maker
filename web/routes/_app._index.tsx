import {
  BlockStack,
  Card,
  Page,
  Text,
  Frame,
  InlineGrid,
  Box,
  InlineStack,
  Button,
  TextField,
  EmptyState,
  Spinner,
  Popover,
  ActionList,
  DatePicker,
  DataTable,
  Filters,
  ChoiceList,
  Icon,
} from "@shopify/polaris";
import {
  CalendarIcon,
  SettingsIcon
} from '@shopify/polaris-icons';
import { useState, useCallback, useMemo } from "react";

interface MetricCard {
  label: string;
  value: string;
  trend?: string;
}

interface ProductAnalytic {
  id: string;
  productName: string;
  sales: number;
  clicks: number;
  rpv: number;
  conversionRate: number;
  avgOrderValue: number;
  grossProfitPercentage: number;
  profitPerVisitor: number;
}

// Mock data - outside component to prevent recreation
const MOCK_METRICS: MetricCard[] = [
  { label: "Total Revenue", value: "$12,450.50", trend: "+12.5%" },
  { label: "Total Clicks", value: "1,240", trend: "+8.2%" },
  { label: "Revenue Per Visitor", value: "$10.03", trend: "+4.1%" },
];

const MOCK_PRODUCTS: ProductAnalytic[] = [
  {
    id: "1",
    productName: "Premium Wireless Headphones",
    sales: 45,
    clicks: 320,
    rpv: 38.90,
    conversionRate: 14.1,
    avgOrderValue: 129.50,
    grossProfitPercentage: 42.5,
    profitPerVisitor: 4.15,
  },
  {
    id: "2",
    productName: "Laptop Stand",
    sales: 28,
    clicks: 210,
    rpv: 16.67,
    conversionRate: 13.3,
    avgOrderValue: 49.99,
    grossProfitPercentage: 55.0,
    profitPerVisitor: 9.17,
  },
  {
    id: "3",
    productName: "USB-C Cable",
    sales: 156,
    clicks: 580,
    rpv: 4.21,
    conversionRate: 26.9,
    avgOrderValue: 12.99,
    grossProfitPercentage: 65.0,
    profitPerVisitor: 2.74,
  },
  {
    id: "4",
    productName: "Mechanical Keyboard",
    sales: 62,
    clicks: 445,
    rpv: 24.32,
    conversionRate: 13.9,
    avgOrderValue: 149.99,
    grossProfitPercentage: 48.0,
    profitPerVisitor: 11.67,
  },
  {
    id: "5",
    productName: "Wireless Mouse",
    sales: 89,
    clicks: 523,
    rpv: 14.56,
    conversionRate: 17.0,
    avgOrderValue: 39.99,
    grossProfitPercentage: 52.0,
    profitPerVisitor: 7.57,
  },
];

export default function Index() {
  // Popovers
  const [datePopoverActive, setDatePopoverActive] = useState(false);
  const [settingsPopoverActive, setSettingsPopoverActive] = useState(false);

  // Settings
  const [profitMargin, setProfitMargin] = useState("30");
  const [tempProfitMargin, setTempProfitMargin] = useState("30");

  // Date range - initialized once
  const [{ month, year }, setDate] = useState(() => {
    const today = new Date();
    return {
      month: today.getMonth(),
      year: today.getFullYear(),
    };
  });
  const [selectedDates, setSelectedDates] = useState(() => {
    const today = new Date();
    return {
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7),
      end: today,
    };
  });

  // Table filters
  const [queryValue, setQueryValue] = useState("");
  const [conversionRateFilter, setConversionRateFilter] = useState<string[]>([]);
  const [sortValue, setSortValue] = useState("sales-desc");
  const [isLoading, setIsLoading] = useState(false);

  // Handlers
  const handleDatePresetSelect = useCallback((value: string) => {
    const currentDate = new Date();
    let startDate = new Date();

    switch (value) {
      case "yesterday":
        startDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() - 1
        );
        setSelectedDates({ start: startDate, end: startDate });
        break;
      case "7days":
        startDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() - 7
        );
        setSelectedDates({ start: startDate, end: currentDate });
        break;
      case "30days":
        startDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() - 30
        );
        setSelectedDates({ start: startDate, end: currentDate });
        break;
      case "90days":
        startDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() - 90
        );
        setSelectedDates({ start: startDate, end: currentDate });
        break;
    }
    setDatePopoverActive(false);
  }, []);

  const handleMonthChange = useCallback((month: number, year: number) => {
    setDate({ month, year });
  }, []);

  const formatDateRange = useCallback(() => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    if (selectedDates.start.toDateString() === selectedDates.end.toDateString()) {
      return formatDate(selectedDates.start);
    }

    return `${formatDate(selectedDates.start)} - ${formatDate(selectedDates.end)}`;
  }, [selectedDates]);

  const handleSaveProfitMargin = useCallback(() => {
    setProfitMargin(tempProfitMargin);
    setSettingsPopoverActive(false);
  }, [tempProfitMargin]);

  const handleCancelProfitMargin = useCallback(() => {
    setTempProfitMargin(profitMargin);
    setSettingsPopoverActive(false);
  }, [profitMargin]);

  const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);
  const handleConversionRateFilterRemove = useCallback(
    () => setConversionRateFilter([]),
    []
  );
  const handleFiltersClearAll = useCallback(() => {
    setQueryValue("");
    setConversionRateFilter([]);
  }, []);

  // Filter and sort
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...MOCK_PRODUCTS];

    if (queryValue) {
      filtered = filtered.filter((product) =>
        product.productName.toLowerCase().includes(queryValue.toLowerCase())
      );
    }

    if (conversionRateFilter.length > 0) {
      filtered = filtered.filter((product) => {
        if (conversionRateFilter.includes("high") && product.conversionRate >= 15)
          return true;
        if (
          conversionRateFilter.includes("medium") &&
          product.conversionRate >= 10 &&
          product.conversionRate < 15
        )
          return true;
        if (conversionRateFilter.includes("low") && product.conversionRate < 10)
          return true;
        return false;
      });
    }

    filtered.sort((a, b) => {
      switch (sortValue) {
        case "sales-desc":
          return b.sales - a.sales;
        case "sales-asc":
          return a.sales - b.sales;
        case "rpv-desc":
          return b.rpv - a.rpv;
        case "rpv-asc":
          return a.rpv - b.rpv;
        case "conversion-desc":
          return b.conversionRate - a.conversionRate;
        case "conversion-asc":
          return a.conversionRate - b.conversionRate;
        default:
          return 0;
      }
    });

    return filtered;
  }, [queryValue, conversionRateFilter, sortValue]);

  // Table rows with enhanced formatting
  const rows = useMemo(
    () =>
      filteredAndSortedProducts.map((product) => [
        // Product Name - highlighted
        <Text variant="bodyMd" as="span" fontWeight="medium" truncate>
          {product.productName}
        </Text>,
        // Sales - bold for emphasis
        <Text variant="bodyMd" as="span" fontWeight="semibold" tone="success">
          {product.sales}
        </Text>,
        // Clicks
        <Text variant="bodyMd" as="span">
          {product.clicks}
        </Text>,
        // RPV - currency highlighting
        <Text variant="bodyMd" as="span" fontWeight="medium" tone="success">
          ${product.rpv.toFixed(2)}
        </Text>,
        // Conversion Rate - percentage with color coding
        <Text 
          variant="bodyMd" 
          as="span" 
          fontWeight="medium"
          tone={product.conversionRate >= 15 ? "success" : "subdued"}
        >
          {product.conversionRate.toFixed(1)}%
        </Text>,
        // Avg Order Value
        <Text variant="bodyMd" as="span">
          ${product.avgOrderValue.toFixed(2)}
        </Text>,
        // Profit %
        <Text 
          variant="bodyMd" 
          as="span" 
          fontWeight="medium"
          tone={product.grossProfitPercentage >= 50 ? "success" : "subdued"}
        >
          {product.grossProfitPercentage.toFixed(1)}%
        </Text>,
        // Profit/Visitor - highlighted
        <Text variant="bodyMd" as="span" fontWeight="semibold" tone="success">
          ${product.profitPerVisitor.toFixed(2)}
        </Text>,
      ]),
    [filteredAndSortedProducts]
  );

  // Filters config
  const filters = [
    {
      key: "conversionRate",
      label: "Conversion Rate",
      filter: (
        <ChoiceList
          title="Conversion Rate"
          titleHidden
          choices={[
            { label: "High (≥15%)", value: "high" },
            { label: "Medium (10-15%)", value: "medium" },
            { label: "Low (<10%)", value: "low" },
          ]}
          selected={conversionRateFilter}
          onChange={setConversionRateFilter}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters = [];
  if (conversionRateFilter.length > 0) {
    appliedFilters.push({
      key: "conversionRate",
      label: `Conversion Rate: ${conversionRateFilter
        .map((val) => {
          if (val === "high") return "High";
          if (val === "medium") return "Medium";
          return "Low";
        })
        .join(", ")}`,
      onRemove: handleConversionRateFilterRemove,
    });
  }

  // Popovers
  const dateRangeActivator = (
    <Button
      onClick={() => setDatePopoverActive(!datePopoverActive)}
      disclosure
      icon={<Icon source={CalendarIcon as any} />}
    >
      {formatDateRange()}
    </Button>
  );

  const settingsActivator = (
    <Button
      onClick={() => setSettingsPopoverActive(!settingsPopoverActive)}
      icon={<Icon source={SettingsIcon as any} />}
    >
      Settings
    </Button>
  );

  return (
    <Frame>
      <Page
        title="RevenueFlows AI Analytics Dashboard"
        subtitle="Track your product performance and insights"
      >
        <BlockStack gap="500">

          {/* Metrics */}
          <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
            {MOCK_METRICS.map((metric, index) => (
              <Card key={index}>
                <BlockStack gap="200">
                  <Text variant="bodySm" tone="subdued" as="p">
                    {metric.label}
                  </Text>
                  <InlineStack align="space-between" blockAlign="end">
                    <Text variant="heading2xl" as="h3">
                      {metric.value}
                    </Text>
                    {metric.trend && (
                      <Text variant="bodyMd" tone="success" as="span">
                        {metric.trend}
                      </Text>
                    )}
                  </InlineStack>
                </BlockStack>
              </Card>
            ))}
          </InlineGrid>

          {/* Table Card */}
          <Card padding="0">
            <BlockStack gap="0">
              {/* Table Header with Date and Settings */}
              <Box padding="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingMd" as="h2">
                    Product Analytics
                  </Text>
                  <InlineStack gap="300">
                    <Popover
                      active={datePopoverActive}
                      activator={dateRangeActivator}
                      autofocusTarget="first-node"
                      onClose={() => setDatePopoverActive(false)}
                      preferredAlignment="right"
                    >
                      <Box padding="400">
                        <BlockStack gap="400">
                          <Text variant="headingMd" as="h2">
                            Select date range
                          </Text>

                          <ActionList
                            actionRole="menuitem"
                            items={[
                              {
                                content: "Yesterday",
                                onAction: () => handleDatePresetSelect("yesterday"),
                              },
                              {
                                content: "Last 7 Days",
                                onAction: () => handleDatePresetSelect("7days"),
                              },
                              {
                                content: "Last 30 Days",
                                onAction: () => handleDatePresetSelect("30days"),
                              },
                              {
                                content: "Last 90 Days",
                                onAction: () => handleDatePresetSelect("90days"),
                              },
                            ]}
                          />

                          <Box
                            borderBlockStartWidth="025"
                            borderColor="border"
                            paddingBlockStart="400"
                          >
                            <DatePicker
                              month={month}
                              year={year}
                              onChange={setSelectedDates}
                              onMonthChange={handleMonthChange}
                              selected={selectedDates}
                              allowRange
                            />
                          </Box>
                        </BlockStack>
                      </Box>
                    </Popover>

                    <Popover
                      active={settingsPopoverActive}
                      activator={settingsActivator}
                      autofocusTarget="first-node"
                      onClose={() => setSettingsPopoverActive(false)}
                      preferredAlignment="right"
                    >
                      <Box padding="400" minWidth="300px">
                        <BlockStack gap="400">
                          <Text variant="headingMd" as="h2">
                            Settings
                          </Text>

                          <BlockStack gap="200">
                            <Text variant="bodySm" as="p" tone="subdued">
                              Default Profit Margin (%)
                            </Text>
                            <TextField
                              label="Profit Margin"
                              type="number"
                              value={tempProfitMargin}
                              onChange={setTempProfitMargin}
                              autoComplete="off"
                              labelHidden
                            />
                          </BlockStack>

                          <InlineStack align="end" gap="200">
                            <Button onClick={handleCancelProfitMargin}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveProfitMargin} variant="primary">
                              Save
                            </Button>
                          </InlineStack>
                        </BlockStack>
                      </Box>
                    </Popover>
                  </InlineStack>
                </InlineStack>
              </Box>

              {/* Filters and Sort - Inside Card */}
              <Box
                padding="400"
                borderBlockStartWidth="025"
                borderColor="border"
              >
                <BlockStack gap="300">
                  <Filters
                    queryValue={queryValue}
                    filters={filters}
                    appliedFilters={appliedFilters}
                    onQueryChange={setQueryValue}
                    onQueryClear={handleQueryValueRemove}
                    onClearAll={handleFiltersClearAll}
                    queryPlaceholder="Search products..."
                  />
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="bodySm" as="p" tone="subdued">
                      {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? "product" : "products"}
                    </Text>
                    <select
                      value={sortValue}
                      onChange={(e) => setSortValue(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "4px",
                        border: "1px solid var(--p-color-border)",
                        fontSize: "13px",
                        fontFamily: "inherit",
                        backgroundColor: "white",
                        cursor: "pointer",
                        transition: "border-color 0.2s",
                      }}
                    >
                      <option value="sales-desc">Sort: Sales (High to Low)</option>
                      <option value="sales-asc">Sort: Sales (Low to High)</option>
                      <option value="rpv-desc">Sort: RPV (High to Low)</option>
                      <option value="rpv-asc">Sort: RPV (Low to High)</option>
                      <option value="conversion-desc">
                        Sort: Conv. Rate (High to Low)
                      </option>
                      <option value="conversion-asc">
                        Sort: Conv. Rate (Low to High)
                      </option>
                    </select>
                  </InlineStack>
                </BlockStack>
              </Box>

              {/* Data Table or Empty State */}
              {isLoading ? (
                <Box padding="400">
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Spinner accessibilityLabel="Loading analytics" />
                  </div>
                </Box>
              ) : filteredAndSortedProducts.length === 0 ? (
                <Box padding="400">
                  <EmptyState
                    heading={
                      queryValue || conversionRateFilter.length > 0
                        ? "No products found"
                        : "No product data available"
                    }
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>
                      {queryValue || conversionRateFilter.length > 0
                        ? "Try adjusting your filters or search query"
                        : "Product analytics will appear here once you generate AI content for products."}
                    </p>
                  </EmptyState>
                </Box>
              ) : (
                <Box padding="0">
                  <DataTable
                    columnContentTypes={[
                      "text",
                      "numeric",
                      "numeric",
                      "numeric",
                      "numeric",
                      "numeric",
                      "numeric",
                      "numeric",
                    ]}
                    headings={[
                      "Product Name",
                      "Sales",
                      "Clicks",
                      "RPV",
                      "Conv. Rate",
                      "Avg Order Value",
                      "Profit %",
                      "Profit/Visitor",
                    ]}
                    rows={rows}
                    hoverable
                    footerContent={`Total: ${filteredAndSortedProducts.length} of ${MOCK_PRODUCTS.length} products`}
                  />
                </Box>
              )}
            </BlockStack>
          </Card>
        </BlockStack>
      </Page>
    </Frame>
  );
}
