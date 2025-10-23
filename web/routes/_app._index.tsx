import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Layout,
  Link,
  Page,
  Text,
  Badge,
  DataTable,
  Spinner,
  Pagination,
  Filters,
  EmptyState,
  Toast,
  Frame,
  TextField,
  Modal,
  FormLayout,
  InlineStack,
  Divider,
  RadioButton
} from "@shopify/polaris";
import { useGlobalAction } from "@gadgetinc/react";
import { api } from "../api";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "@remix-run/react";

export default function Index() {
  // ...existing code...
  const navigate = useNavigate();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [{ fetching: isGenerating }, generateAiContent] = useGlobalAction(api.generateAiContent);
  const [{ fetching: isGeneratingFromUrl }, generateAiContentFromUrl] = useGlobalAction((api as any).generateAiContentFromUrl);
  const [{ fetching: isCreatingProduct }, createShopifyProduct] = useGlobalAction((api as any).createShopifyProduct);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);
  const [overwriteModalActive, setOverwriteModalActive] = useState(false);
  const [overwriteProductId, setOverwriteProductId] = useState<string | null>(null);
  
  // Generation modal state
  const [generationModalActive, setGenerationModalActive] = useState(false);
  const [generationProductId, setGenerationProductId] = useState<string | null>(null);
  const [generationUrl, setGenerationUrl] = useState('');
  const [isOverwriteMode, setIsOverwriteMode] = useState(false);
  const [generationOption, setGenerationOption] = useState<'shopify' | 'url'>('shopify');
  const [productDescription, setProductDescription] = useState('');
  
  // Preserve generation data for overwrite confirmation
  const [pendingGenerationData, setPendingGenerationData] = useState<{
    option: 'shopify' | 'url';
    description: string;
    url: string;
  } | null>(null);
  
  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal state
  const [modalActive, setModalActive] = useState(false);
  const [productTitle, setProductTitle] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const PRODUCTS_PER_PAGE = 10;

  // Add this function to fetch generation job data
  const fetchGenerationJobData = async (products: any[]) => {
    try {
      // For each product, check if there's a recent generation job
      const updatedProducts = await Promise.all(
        products.map(async (product) => {
          try {
            const numericProductId = product.id.replace('gid://shopify/Product/', '');
            
            // Find the most recent generation job for this product
            const jobs = await api.generationJob.findMany({
              filter: {
                productId: { equals: numericProductId }
              },
              sort: { createdAt: "Descending" },
              first: 1
            });
            
            if (jobs.length > 0) {
              const job = jobs[0];
              
              // Check if there's an AI content draft for this job
              let finalStatus: string = job.status;
              let draftId = null;
              if (job.status === 'completed') {
                try {
                  const drafts = await api.aiContentDraft.findMany({
                    filter: {
                      generationJob: { id: { equals: job.id } }
                    },
                    first: 1
                  });
                  
                  if (drafts.length > 0) {
                    finalStatus = drafts[0].status as string;
                    draftId = drafts[0].id;
                  }
                } catch (err) {
                  // If draft lookup fails, keep job status
                  console.error('Error fetching AI content draft:', err);
                }
              }
              
              return {
                ...product,
                status: finalStatus,
                draftId: draftId,
                lastGenerated: job.startedAt ? new Date(job.startedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                }) : null
              };
            }
            
            return product;
          } catch (err) {
            console.error(`Error fetching job for product ${product.id}:`, err);
            return product;
          }
        })
      );
      
      return updatedProducts;
    } catch (error) {
      console.error('Error fetching generation job data:', error);
      return products;
    }
  };

  // Simple manual refresh function
  const handleRefreshStatus = useCallback(async () => {
    if (allProducts.length > 0 && !isRefreshing) {
      try {
        setIsRefreshing(true);
        const productsWithJobData = await fetchGenerationJobData(allProducts);
        
        // Sort products alphabetically by name
        const sortedProducts = productsWithJobData.sort((a, b) => 
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
        
        setAllProducts(sortedProducts);
        setToastMessage('Status refreshed successfully!');
        setToastError(false);
        setToastActive(true);
      } catch (error) {
        console.error('Error refreshing status:', error);
        setToastMessage('Failed to refresh status. Please try again.');
        setToastError(true);
        setToastActive(true);
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [allProducts, isRefreshing]);

  // Full products list refresh function
  const handleRefreshProductsList = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      // Call our custom action to fetch Shopify products with pagination support
      const response = await (api as any).getShopifyProducts({ first: 250, maxProducts: 1000 });
      
      if (response.success && response.products) {
        // Transform Shopify products to our format
        const transformedProducts = response.products.map((product: any) => ({
          id: product.id,
          name: product.title,
          handle: product.handle,
          status: 'not_generated', // Default AI generation status
          lastGenerated: null,
          shopifyStatus: product.status,
          productType: product.productType,
          vendor: product.vendor,
          tags: product.tags,
          featuredImage: product.featuredImage,
          images: product.images || [],
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        }));
        
        // Load generation job data to get real status and timestamps
        const productsWithJobData = await fetchGenerationJobData(transformedProducts);
        
        // Sort products alphabetically by name
        const sortedProducts = productsWithJobData.sort((a, b) => 
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
        
        setAllProducts(sortedProducts);
        setError(null);
        setToastMessage('Products list refreshed successfully!');
        setToastError(false);
        setToastActive(true);
      } else {
        throw new Error(response.error || 'Failed to fetch products');
      }
    } catch (error: any) {
      console.error('Error refreshing products list:', error);
      setToastMessage('Failed to refresh products list. Please try again.');
      setToastError(true);
      setToastActive(true);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Fetch real Shopify products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        
                // Call our custom action to fetch Shopify products with pagination support
        const response = await (api as any).getShopifyProducts({ first: 250, maxProducts: 1000 });
        
        if (response.success && response.products) {
          // Transform Shopify products to our format
          const transformedProducts = response.products.map((product: any) => ({
            id: product.id,
            name: product.title,
            handle: product.handle,
            status: 'not_generated', // Default AI generation status
            lastGenerated: null,
            shopifyStatus: product.status,
            productType: product.productType,
            vendor: product.vendor,
            tags: product.tags,
            featuredImage: product.featuredImage,
            images: product.images || [],
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
          }));
          
          // Load generation job data to get real status and timestamps
          const productsWithJobData = await fetchGenerationJobData(transformedProducts);
          
          // Sort products alphabetically by name
          const sortedProducts = productsWithJobData.sort((a, b) => 
            a.name.toLowerCase().localeCompare(b.name.toLowerCase())
          );
          
          setAllProducts(sortedProducts);
          setError(null);
        } else {
          throw new Error(response.error || 'Failed to fetch products');
        }
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to fetch products from Shopify');
        // Fallback to mock data if real data fails
        setAllProducts([
          {
            id: 'gid://shopify/Product/1',
            name: 'No Products Found - Check Shopify Connection',
            handle: 'no-products',
            status: 'not_generated',
            lastGenerated: null,
            shopifyStatus: 'active',
            featuredImage: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter and paginate products
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return allProducts;
    
    return allProducts.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.productType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.vendor?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allProducts, searchQuery]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const showPagination = filteredProducts.length > PRODUCTS_PER_PAGE;

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Modal handlers
  const handleModalOpen = useCallback(() => {
    setModalActive(true);
    setProductTitle('');
    setProductUrl('');
  }, []);

  const handleModalClose = useCallback(() => {
    setModalActive(false);
    setProductTitle('');
    setProductUrl('');
    setIsProcessing(false);
  }, []);

  const handleOpenGenerationModal = useCallback((productId: string, isOverwrite: boolean = false) => {
    setGenerationProductId(productId);
    setIsOverwriteMode(isOverwrite);
    setGenerationUrl('');
    setGenerationOption('shopify');
    setGenerationModalActive(true);
  }, []);

  const handleCloseGenerationModal = useCallback(() => {
    setGenerationModalActive(false);
    setGenerationProductId(null);
    setGenerationUrl('');
    setIsOverwriteMode(false);
    setGenerationOption('shopify');
    setProductDescription('');
  }, []);

  const handleGenerationContinue = useCallback(async () => {
    if (!generationProductId) return;

    // Validate required fields based on selected option
    if (generationOption === 'shopify') {
      if (!productDescription.trim()) {
        setToastMessage('Please fill in the product description.');
        setToastError(true);
        setToastActive(true);
        return;
      }
    } else if (generationOption === 'url') {
      if (!generationUrl.trim()) {
        setToastMessage('Please enter a valid URL.');
        setToastError(true);
        setToastActive(true);
        return;
      }
    }

    handleCloseGenerationModal();

    if (generationOption === 'shopify') {
      if (isOverwriteMode) {
        // For overwrite mode, preserve the generation data and show the overwrite confirmation modal
        setPendingGenerationData({
          option: generationOption,
          description: productDescription,
          url: generationUrl
        });
        setOverwriteProductId(generationProductId);
        setOverwriteModalActive(true);
      } else {
        // Direct generation
        try {
          console.log('Starting AI generation for product:', generationProductId);
          
          const response = await generateAiContent({ 
            productId: generationProductId,
            product_description: productDescription
          } as any);
          
          console.log('API Response:', response);
          
          if (response.data?.success) {
            setToastMessage(response.data.message || 'Request sent. Response will be available for review soon.');
            setToastError(false);
            setToastActive(true);
            
            // Update the product status and last generated time in the UI
            setAllProducts(prevProducts => 
              prevProducts.map(product => 
                product.id === generationProductId 
                  ? { 
                      ...product, 
                      status: 'in_progress',
                      draftId: null, // Clear draft ID since this is a new generation
                      lastGenerated: new Date().toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric', 
                        hour: 'numeric',
                        minute: '2-digit'
                      })
                    }
                  : product
              )
            );
          } else {
            throw new Error(response.error?.message || 'Generation failed');
          }
          
        } catch (error: any) {
          console.error('Generation failed:', error);
          console.error('Request details:', { 
            originalProductId: generationProductId, 
            numericProductId: generationProductId.replace('gid://shopify/Product/', '')
          });
          setToastMessage('Generation failed. Please try again.');
          setToastError(true);
          setToastActive(true);
        }
      }
    } else if (generationOption === 'url') {
      if (!generationUrl.trim()) {
        setToastMessage('Please enter a valid URL');
        setToastError(true);
        setToastActive(true);
        return;
      }

      if (isOverwriteMode) {
        // For overwrite mode, preserve the generation data and show the overwrite confirmation modal
        setPendingGenerationData({
          option: generationOption,
          description: productDescription,
          url: generationUrl
        });
        setOverwriteProductId(generationProductId);
        setOverwriteModalActive(true);
      } else {
        // Direct generation
        try {
          console.log('Starting AI generation from URL for product:', generationProductId, 'with URL:', generationUrl);
          
          const response = await generateAiContentFromUrl({ 
            productId: generationProductId,
            productUrl: generationUrl.trim()
          });
          
          console.log('AI generation from URL response:', response);
          
          if (response.data?.success) {
            setToastMessage(response.data.message || 'Request sent. Response will be available for review soon.');
            setToastError(false);
            setToastActive(true);
            
            // Update the product status and last generated time in the UI
            setAllProducts(prevProducts => 
              prevProducts.map(product => 
                product.id === generationProductId 
                  ? { 
                      ...product, 
                      status: 'in_progress',
                      draftId: null, // Clear draft ID since this is a new generation
                      lastGenerated: new Date().toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric', 
                        hour: 'numeric',
                        minute: '2-digit'
                      })
                    }
                  : product
              )
            );
          } else {
            throw new Error(response.error?.message || 'Generation failed');
          }
          
        } catch (error: any) {
          console.error('Generation from URL failed:', error);
          setToastMessage('Generation failed. Please try again.');
          setToastError(true);
          setToastActive(true);
        }
      }
    }
  }, [generationProductId, generationOption, generationUrl, productDescription, isOverwriteMode, handleCloseGenerationModal, generateAiContent, generateAiContentFromUrl]);

  const isContinueDisabled = generationOption === 'url' && !generationUrl.trim();

  const handleCreateAndGenerate = useCallback(async () => {
    if (!productTitle.trim() || !productUrl.trim()) {
      setToastMessage('Please fill in both product title and URL');
      setToastError(true);
      setToastActive(true);
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('Starting product creation and AI generation...');
      console.log('API object keys:', Object.keys(api));
      console.log('Has createShopifyProduct:', !!(api as any).createShopifyProduct);
      console.log('Has generateAiContentFromUrl:', !!(api as any).generateAiContentFromUrl);
      
      // Check if the actions are available
      if (!(api as any).createShopifyProduct) {
        throw new Error('createShopifyProduct action is not available. Please restart the development server.');
      }
      
      if (!(api as any).generateAiContentFromUrl) {
        throw new Error('generateAiContentFromUrl action is not available. Please restart the development server.');
      }
      
      // Step 1: Create the product
      console.log('Creating product with title:', productTitle);
      const createResponse = await createShopifyProduct({ 
        title: productTitle.trim()
      });
      
      console.log('Product creation response:', createResponse);
      
      if (!createResponse.data?.success || !createResponse.data?.product) {
        throw new Error(createResponse.error?.message || 'Failed to create product');
      }
      
      const newProduct = createResponse.data.product;
      const productGid = newProduct.id;
      
      console.log('Created product with GID:', productGid);
      
      // Step 2: Generate AI content from URL
      console.log('Starting AI generation for product:', productGid, 'with URL:', productUrl);
      const generateResponse = await generateAiContentFromUrl({ 
        productId: productGid,
        productUrl: productUrl.trim()
      });
      
      console.log('AI generation response:', generateResponse);
      
      if (!generateResponse.data?.success) {
        throw new Error(generateResponse.error?.message || 'Failed to start AI generation');
      }
      
      // Step 3: Add the new product to the UI immediately (sorted alphabetically)
      const productData = {
        id: productGid,
        name: newProduct.title,
        handle: newProduct.handle || productTitle.toLowerCase().replace(/\s+/g, '-'),
        status: 'in_progress',
        lastGenerated: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        }),
        shopifyStatus: newProduct.status || 'draft',
        featuredImage: null,
        createdAt: newProduct.createdAt || new Date().toISOString(),
        updatedAt: newProduct.updatedAt || new Date().toISOString()
      };
      
      // Add the new product and sort alphabetically
      setAllProducts(prevProducts => {
        const updatedProducts = [productData, ...prevProducts];
        return updatedProducts.sort((a, b) => 
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
      });
      
      // Step 4: Close modal and show success message
      handleModalClose();
      setToastMessage('Product created and AI generation started successfully!');
      setToastError(false);
      setToastActive(true);
      
      // Step 5: Refresh the entire products list after a delay to get the latest data
      setTimeout(() => {
        console.log('Refreshing products list after delay...');
        handleRefreshProductsList();
      }, 3000); // 3 second delay
      
    } catch (error: any) {
      console.error('Error creating product and generating content:', error);
      setToastMessage(error.message || 'Failed to create product. Please try again.');
      setToastError(true);
      setToastActive(true);
      setIsProcessing(false);
    }
  }, [productTitle, productUrl, createShopifyProduct, generateAiContentFromUrl, handleModalClose, handleRefreshProductsList]);

  const handleGenerateAI = async (productId: string) => {
    try {
      console.log('Starting AI generation for product:', productId);
      
      // Call the generateAiContent action with full GID
      const response = await generateAiContent({ 
        productId: productId // Send full GID: gid://shopify/Product/12345
      });
      
      console.log('API Response:', response);
      
      if (response.data?.success) {
        setToastMessage(response.data.message || 'Request sent. Response will be available for review soon.');
        setToastError(false);
        setToastActive(true);
        
        // Update the product status and last generated time in the UI
        setAllProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === productId 
              ? { 
                  ...product, 
                  status: 'in_progress',
                  draftId: null, // Clear draft ID since this is a new generation
                  lastGenerated: new Date().toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric', 
                    hour: 'numeric',
                    minute: '2-digit'
                  })
                }
              : product
          )
        );
      } else {
        throw new Error(response.error?.message || 'Generation failed');
      }
      
    } catch (error: any) {
      console.error('Generation failed:', error);
      console.error('Request details:', { 
        originalProductId: productId, 
        numericProductId: productId.replace('gid://shopify/Product/', '')
      });
      setToastMessage('Generation failed. Please try again.');
      setToastError(true);
      setToastActive(true);
    }
  };

  // Overwrite handler for published products
  const handleOverwriteGenerateAI = async () => {
    if (!overwriteProductId || !pendingGenerationData) return;
    
    setOverwriteModalActive(false);
    
    try {
      let response;
      
      if (pendingGenerationData.option === 'shopify') {
        console.log('Starting AI generation for product (overwrite):', overwriteProductId);
        
        response = await generateAiContent({ 
          productId: overwriteProductId,
          product_description: pendingGenerationData.description
        } as any);
      } else {
        console.log('Starting AI generation from URL (overwrite):', overwriteProductId);
        
        response = await generateAiContentFromUrl({ 
          productId: overwriteProductId,
          url: pendingGenerationData.url
        } as any);
      }
      
      console.log('API Response (overwrite):', response);
      
      if (response.data?.success) {
        setToastMessage(response.data.message || 'Request sent. Response will be available for review soon.');
        setToastError(false);
        setToastActive(true);
        
        // Update the product status and last generated time in the UI
        setAllProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === overwriteProductId 
              ? { 
                  ...product, 
                  status: 'in_progress',
                  lastGenerated: new Date().toISOString()
                } 
              : product
          )
        );
        
        // Refresh products list to get updated data
        setTimeout(handleRefreshProductsList, 1000);
      } else {
        setToastMessage(response.data?.message || 'Generation failed');
        setToastError(true);
        setToastActive(true);
      }
    } catch (error) {
      console.error('Error generating AI content (overwrite):', error);
      setToastMessage('Failed to generate AI content. Please try again.');
      setToastError(true);
      setToastActive(true);
    } finally {
      // Clean up
      setOverwriteProductId(null);
      setPendingGenerationData(null);
    }
  };

  const showToast = useCallback(() => {
    setToastActive(false);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_generated':
        return <Badge tone="critical">Not Generated</Badge>;
      case 'in_progress':
        return <Badge tone="info">In Progress</Badge>;
      case 'ready_for_review':
        return <Badge tone="attention">Ready for Review</Badge>;
      case 'published':
        return <Badge tone="success">Published</Badge>;
      case 'completed':
        return <Badge tone="success">Completed</Badge>;
      default:
        return <Badge tone="critical">Not Generated</Badge>;
    }
  };

  const rows = paginatedProducts.map((product: any) => [
    product.name,
    getStatusBadge(product.status),
    product.lastGenerated || 'Never',
    (() => {
      // If published, show both buttons
      if (product.status === 'published' && product.draftId) {
        return (
          <InlineStack gap="200">
            <Button
              size="slim"
              disabled={product.status === 'in_progress' || isGenerating}
              onClick={() => navigate(`/editor/${product.draftId}`)}
            >
              Review & Edit
            </Button>
            <Button
              size="slim"
              tone="critical"
              disabled={product.status === 'in_progress' || isGenerating}
              loading={isGenerating}
              onClick={() => handleOpenGenerationModal(product.id, true)}
            >
              Generate New
            </Button>
          </InlineStack>
        );
      }
      // If ready for review, show review button
      if (product.status === 'ready_for_review' && product.draftId) {
        return (
          <Button
            size="slim"
            disabled={product.status === 'in_progress' || isGenerating}
            onClick={() => navigate(`/editor/${product.draftId}`)}
          >
            Review & Edit
          </Button>
        );
      }
      // Otherwise, show generate button
      return (
        <Button
          size="slim"
          disabled={product.status === 'in_progress' || isGenerating}
          loading={isGenerating}
          onClick={() => handleOpenGenerationModal(product.id, false)}
        >
          Generate
        </Button>
      );
    })()
  ]);

  return (
    <Frame>
      <Page title="AI Sales Page Automator">
        <Box paddingBlockEnd="800">
          <Layout>
            <Layout.Section>
              <Card>
                  <BlockStack gap="400">
                    <Box paddingBlockEnd="200">
                      <BlockStack gap="200">
                        <Box>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text variant="headingMd" as="h2">
                              Product Sales Pages
                            </Text>
                            <Button 
                              size="slim" 
                              onClick={handleRefreshProductsList}
                              disabled={isRefreshing || isLoading}
                              loading={isRefreshing}
                            >
                              Refresh Status
                            </Button>
                          </div>
                        </Box>
                        <Text variant="bodyMd" as="p">
                          Generate AI-powered sales page content for your products. Generation might take a few minutes.
                        </Text>
                      </BlockStack>
                    </Box>                            
              {error && (
                <Banner tone="critical">
                  <Text variant="bodyMd" as="p">Error loading products: {error}</Text>
                </Banner>
              )}
              
              {isLoading ? (
                <Box padding="800">
                  <BlockStack align="center">
                    <Spinner accessibilityLabel="Loading products" size="large" />
                  </BlockStack>
                </Box>
              ) : (
                <BlockStack gap="400">
                  {/* Search Bar and Generate from URL Button - only show for 10+ products */}
                  {allProducts.length >= 10 && (
                    <InlineStack gap="400" align="space-between">
                      <Box minWidth="80%">
                        <TextField
                          label=""
                          placeholder="Search products"
                          value={searchQuery}
                          onChange={handleSearchChange}
                          clearButton
                          onClearButtonClick={() => setSearchQuery('')}
                          autoComplete="off"
                        />
                      </Box>
                      <Button onClick={handleModalOpen}>
                        Generate from URL
                      </Button>
                    </InlineStack>
                  )}

                  {/* Generate from URL Button for smaller product lists */}
                  {allProducts.length < 10 && allProducts.length > 0 && (
                    <Box paddingBlockEnd="400">
                      <InlineStack align="end">
                        <Button onClick={handleModalOpen}>
                          Generate from URL
                        </Button>
                      </InlineStack>
                    </Box>
                  )}

                  {/* Products count */}
                  <Text variant="bodySm" tone="subdued" as="p">
                    {filteredProducts.length === allProducts.length 
                      ? `${allProducts.length} products`
                      : `${filteredProducts.length} of ${allProducts.length} products`
                    }
                  </Text>

                  {/* Products table or empty state */}
                  {paginatedProducts.length === 0 ? (
                    <EmptyState
                      heading="No products found"
                      image="https://cdn.shopify.com/s/files/1/0005/4175/0643/files/empty-state.svg"
                    >
                      <Text variant="bodyMd" as="p">
                        {searchQuery 
                          ? `No products match your search "${searchQuery}"`
                          : "No products found in your store"
                        }
                      </Text>
                    </EmptyState>
                  ) : (
                    <BlockStack gap="400">
                      <DataTable
                        columnContentTypes={['text', 'text', 'text', 'text']}
                        headings={['Product', 'AI Content Status', 'Last Generated', 'Actions']}
                        rows={rows}
                        truncate
                      />
                      
                      {/* Pagination - only show for 10+ products */}
                      {showPagination && (
                        <Box paddingBlockStart="400">
                          <BlockStack align="center">
                            <Pagination
                              label={`Page ${currentPage} of ${totalPages}`}
                              hasPrevious={currentPage > 1}
                              onPrevious={() => handlePageChange(currentPage - 1)}
                              hasNext={currentPage < totalPages}
                              onNext={() => handlePageChange(currentPage + 1)}
                            />
                          </BlockStack>
                        </Box>
                      )}
                    </BlockStack>
                  )}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
      </Box>
      </Page>

      {/* Toast for success/error messages */}
      {toastActive && (
        <Toast
          content={toastMessage}
          onDismiss={showToast}
          error={toastError}
        />
      )}

      {/* Generate from URL Modal */}
      <Modal
        open={modalActive}
        onClose={handleModalClose}
        title="Generate Product from URL"
        primaryAction={{
          content: 'Generate',
          onAction: handleCreateAndGenerate,
          loading: isProcessing,
          disabled: !productTitle.trim() || !productUrl.trim() || isProcessing
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: handleModalClose,
            disabled: isProcessing
          }
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Product Title"
              value={productTitle}
              onChange={setProductTitle}
              placeholder="Enter product title"
              autoComplete="off"
              disabled={isProcessing}
            />
            <TextField
              label="Product URL"
              value={productUrl}
              onChange={setProductUrl}
              placeholder="https://example.com/product-page"
              autoComplete="off"
              disabled={isProcessing}
              helpText="Enter the URL of the product page you want to analyze"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Overwrite warning modal for Generate New */}
      <Modal
        open={overwriteModalActive}
        onClose={() => { 
          setOverwriteModalActive(false); 
          setOverwriteProductId(null);
          setPendingGenerationData(null);
        }}
        title="Overwrite Published Content?"
        primaryAction={{
          content: 'Overwrite & Generate',
          onAction: handleOverwriteGenerateAI,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => { 
              setOverwriteModalActive(false); 
              setOverwriteProductId(null);
              setPendingGenerationData(null);
            },
          }
        ]}
      >
        <Modal.Section>
          <Text variant="bodyMd" as="p">
            Generating new content will <b>completely overwrite</b> the current published content for this product. This action cannot be undone.
          </Text>
        </Modal.Section>
      </Modal>

      {/* Generation options modal */}
      <Modal
        open={generationModalActive}
        onClose={handleCloseGenerationModal}
        title="Generate AI Content"
        primaryAction={{
          content: 'Continue',
          onAction: handleGenerationContinue,
          disabled: isContinueDisabled,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: handleCloseGenerationModal,
          }
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text variant="bodyMd" as="p">
              Choose how you want to generate AI content for this product:
            </Text>
            
            <BlockStack gap="300">
              <RadioButton
                label="Use product information from Shopify"
                checked={generationOption === 'shopify'}
                id="shopify-option"
                name="generation-option"
                onChange={() => setGenerationOption('shopify')}
              />
              
              {generationOption === 'shopify' && (
                <Box paddingInlineStart="400">
                  <TextField
                    label="Product Description"
                    value={productDescription}
                    onChange={setProductDescription}
                    placeholder="Enter the product description"
                    multiline={4}
                    autoComplete="off"
                    helpText="Detailed description of the product for AI content generation (product name will be fetched automatically from Shopify)"
                  />
                </Box>
              )}
              
              <RadioButton
                label="Get product information from external reference URL"
                checked={generationOption === 'url'}
                id="url-option"
                name="generation-option"
                onChange={() => setGenerationOption('url')}
              />
              
              {generationOption === 'url' && (
                <Box paddingInlineStart="400">
                  <TextField
                    label="External Product URL"
                    value={generationUrl}
                    onChange={setGenerationUrl}
                    placeholder="https://example.com/product-page"
                    autoComplete="off"
                    helpText="Enter the URL of a product page to analyze and generate content from"
                  />
                </Box>
              )}
            </BlockStack>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Frame>
  );
}
