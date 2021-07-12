const path = require(`path`)
const { postsPerPage } = require(`./src/utils/siteConfig`)
const { paginate } = require(`gatsby-awesome-pagination`)

/**
 * Here is the place where Gatsby creates the URLs for all the
 * posts, tags, pages and authors that we fetched from the Ghost site.
 */
exports.createPages = async ({ graphql, actions }) => {
    const { createPage } = actions

    const result = await graphql(`
        {
            allGhostPost(sort: { order: ASC, fields: published_at }) {
                edges {
                    node {
                        slug
                    }
                }
            }
            allGhostTag(sort: { order: ASC, fields: name }) {
                edges {
                    node {
                        slug
                        url
                        postCount
                    }
                }
            }
            allGhostAuthor(sort: { order: ASC, fields: name }) {
                edges {
                    node {
                        slug
                        url
                        postCount
                    }
                }
            }
            allGhostPage(sort: { order: ASC, fields: published_at }) {
                edges {
                    node {
                        slug
                        url
                    }
                }
            }
        }
    `)

    // Check for any errors
    if (result.errors) {
        throw new Error(result.errors)
    }

    // Extract query results
    const tags = result.data.allGhostTag.edges
    const authors = result.data.allGhostAuthor.edges
    const pages = result.data.allGhostPage.edges
    const posts = result.data.allGhostPost.edges

    // Load templates
    const indexTemplate = path.resolve(`./src/templates/index.js`)
    const tagsTemplate = path.resolve(`./src/templates/tag.js`)
    const authorTemplate = path.resolve(`./src/templates/author.js`)
    const pageTemplate = path.resolve(`./src/templates/page.js`)
    const postTemplate = path.resolve(`./src/templates/post.js`)

    // Create tag pages
    tags.forEach(({ node }) => {
        const totalPosts = node.postCount !== null ? node.postCount : 0

        // This part here defines, that our tag pages will use
        // a `/tag/:slug/` permalink.
        const url = `/tag/${node.slug}`

        const items = Array.from({ length: totalPosts })

        // Create pagination
        paginate({
            createPage,
            items: items,
            itemsPerPage: postsPerPage,
            component: tagsTemplate,
            pathPrefix: ({ pageNumber }) => ((pageNumber === 0) ? url : `${url}/page`),
            context: {
                slug: node.slug,
            },
        })
    })

    // Create author pages
    authors.forEach(({ node }) => {
        const totalPosts = node.postCount !== null ? node.postCount : 0

        // This part here defines, that our author pages will use
        // a `/author/:slug/` permalink.
        const url = `/author/${node.slug}`

        const items = Array.from({ length: totalPosts })

        // Create pagination
        paginate({
            createPage,
            items: items,
            itemsPerPage: postsPerPage,
            component: authorTemplate,
            pathPrefix: ({ pageNumber }) => ((pageNumber === 0) ? url : `${url}/page`),
            context: {
                slug: node.slug,
            },
        })
    })

    // Create pages
    pages.forEach(({ node }) => {
        // This part here defines, that our pages will use
        // a `/:slug/` permalink.
        node.url = `/${node.slug}/`

        createPage({
            path: node.url,
            component: pageTemplate,
            context: {
                // Data passed to context is available
                // in page queries as GraphQL variables.
                slug: node.slug,
            },
        })
    })

    // Create post pages
    posts.forEach(({ node }) => {
        // This part here defines, that our posts will use
        // a `/:slug/` permalink.
        node.url = `/${node.slug}/`

        createPage({
            path: node.url,
            component: postTemplate,
            context: {
                // Data passed to context is available
                // in page queries as GraphQL variables.
                slug: node.slug,
            },
        })
    })

    // Create pagination
    paginate({
        createPage,
        items: posts,
        itemsPerPage: postsPerPage,
        component: indexTemplate,
        pathPrefix: ({ pageNumber }) => {
            if (pageNumber === 0) {
                return `/`
            } else {
                return `/page`
            }
        },
    })
}

// TODO: temporary workaround for https://github.com/gatsbyjs/gatsby/issues/31878
exports.onCreateWebpackConfig = ({
    actions,
    plugins,
    stage,
    getConfig
  }) => {
    // override config only during production JS & CSS build
    if (stage === 'build-javascript') {
      // get current webpack config
      const config = getConfig()
  
      const options = {
        minimizerOptions: {
          preset: [
            `default`,
            {
              svgo: {
                full: true,
                plugins: [
                  // potentially destructive plugins removed - see https://github.com/gatsbyjs/gatsby/issues/15629
                  // use correct config format and remove plugins requiring specific params - see https://github.com/gatsbyjs/gatsby/issues/31619
                //   `removeUselessDefs`,
                  `cleanupAttrs`,
                  `cleanupEnableBackground`,
                  `cleanupIDs`,
                  `cleanupListOfValues`,
                  `cleanupNumericValues`,
                  `collapseGroups`,
                  `convertColors`,
                  `convertPathData`,
                //   `convertStyleToAttrs`,
                  `convertTransform`,
                //   `inlineStyles`,
                  `mergePaths`,
                //   `minifyStyles`,
                  `moveElemsAttrsToGroup`,
                  `moveGroupAttrsToElems`,
                  `prefixIds`,
                  `removeAttrs`,
                  `removeComments`,
                  `removeDesc`,
                  `removeDimensions`,
                  `removeDoctype`,
                  `removeEditorsNSData`,
                  `removeEmptyAttrs`,
                  `removeEmptyContainers`,
                  `removeEmptyText`,
                  `removeHiddenElems`,
                  `removeMetadata`,
                  `removeNonInheritableGroupAttrs`,
                  `removeOffCanvasPaths`,
                  `removeRasterImages`,
                  `removeScriptElement`,
                //   `removeStyleElement`,
                  `removeTitle`,
                  `removeUnknownsAndDefaults`,
                  `removeUnusedNS`,
                //   `removeUselessStrokeAndFill`,
                  `removeXMLProcInst`,
                  `reusePaths`,
                  `sortAttrs`,
                ],
              },
            },
          ],
        }
      }
      // find CSS minimizer
      const minifyCssIndex = config.optimization.minimizer.findIndex(
        minimizer => minimizer.constructor.name ===
          'CssMinimizerPlugin'
      )
      // if found, overwrite existing CSS minimizer with the new one
      if (minifyCssIndex > -1) {
        config.optimization.minimizer[minifyCssIndex] =
          plugins.minifyCss(options)
      }
      // replace webpack config with the modified object
      actions.replaceWebpackConfig(config)
    }
  };
  