-- OffRadarJob Comprehensive Batch Update

PRAGMA foreign_keys = OFF;



-- 1. Companies

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_37signals_com',
        '37signals.com',
        '37signals',
        'Creators of Basecamp, Hey, and Ruby on Rails. Boutique remote team.',
        'Creators of Basecamp, Hey, and Ruby on Rails. Boutique remote team.',
        'https://37signals.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud","Ruby","Web"]',
        '{}',
        'jobs@37signals.com',
        '50-70',
        'Chicago, IL',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_basecamp_com',
        'basecamp.com',
        'Basecamp',
        'Boutique software engineering team in Chicago, IL',
        'Basecamp is an off-radar tech organization located in Chicago, IL.',
        'https://basecamp.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@basecamp.com',
        '50-70',
        'Chicago, IL',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_promptloop_com',
        'promptloop.com',
        'PromptLoop',
        'Micro AI data web scraping & Excel automation startup',
        'Micro AI data web scraping & Excel automation startup',
        'https://promptloop.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@promptloop.com',
        '1-10',
        'Chicago, IL',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_sixfeetup_com',
        'sixfeetup.com',
        'Six Feet Up',
        'Boutique Python, Django, AWS & Cloud consultancies',
        'Boutique Python, Django, AWS & Cloud consultancies',
        'https://sixfeetup.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@sixfeetup.com',
        '20-50',
        'Carmel, IN',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_bendyworks_com',
        'bendyworks.com',
        'Bendyworks',
        'Craftsman software agency specializing in Elixir, Ruby, React',
        'Craftsman software agency specializing in Elixir, Ruby, React',
        'https://bendyworks.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@bendyworks.com',
        '10-25',
        'Madison, WI',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_softwareforgood_com',
        'softwareforgood.com',
        'Software for Good',
        'Mission-driven boutique engineering studio',
        'Mission-driven boutique engineering studio',
        'https://softwareforgood.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@softwareforgood.com',
        '15-30',
        'Minneapolis, MN',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_gaslight_co',
        'gaslight.co',
        'Gaslight',
        'Boutique dev consultancy building Ruby, Elixir & React products',
        'Boutique dev consultancy building Ruby, Elixir & React products',
        'https://gaslight.co',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@gaslight.co',
        '15-30',
        'Cincinnati, OH',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_atomicobject_com',
        'atomicobject.com',
        'Atomic Object',
        'Custom software design & dev consultancy',
        'Custom software design & dev consultancy',
        'https://atomicobject.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@atomicobject.com',
        '50-100',
        'Ann Arbor / Grand Rapids, MI',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_crema_us',
        'crema.us',
        'Crema',
        'Digital product agency & venture studio',
        'Digital product agency & venture studio',
        'https://crema.us',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@crema.us',
        '20-45',
        'Kansas City, MO',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_tablexi_com',
        'tablexi.com',
        'Table XI',
        'Custom software studio (Elixir, Ruby, Python, React)',
        'Custom software studio (Elixir, Ruby, Python, React)',
        'https://tablexi.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@tablexi.com',
        '30-60',
        'Chicago, IL',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_testdouble_com',
        'testdouble.com',
        'Test Double',
        'Engineering consultancy dedicated to software craft',
        'Engineering consultancy dedicated to software craft',
        'https://testdouble.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@testdouble.com',
        '50-90',
        'Columbus, OH',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_nerdery_com',
        'nerdery.com',
        'Nerdery',
        'Midwest digital consultancy & systems development',
        'Midwest digital consultancy & systems development',
        'https://nerdery.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@nerdery.com',
        '100-200',
        'Minneapolis, MN',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_spinweb_com',
        'spinweb.com',
        'SpinWeb',
        'Boutique software engineering team in Indianapolis, IN',
        'SpinWeb is an off-radar tech organization located in Indianapolis, IN.',
        'https://spinweb.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@spinweb.com',
        '10-25',
        'Indianapolis, IN',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_infinitemachines_co',
        'infinitemachines.co',
        'Infinite Machines',
        'Boutique software engineering team in Chicago, IL',
        'Infinite Machines is an off-radar tech organization located in Chicago, IL.',
        'https://infinitemachines.co',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@infinitemachines.co',
        '5-20',
        'Chicago, IL',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_cloverleaf_me',
        'cloverleaf.me',
        'Cloverleaf',
        'Micro-SaaS automated coaching platform',
        'Micro-SaaS automated coaching platform',
        'https://cloverleaf.me',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@cloverleaf.me',
        '15-35',
        'Cincinnati, OH',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_radialdevelopment_com',
        'radialdevelopment.com',
        'Radial Development',
        'Boutique software engineering team in Indianapolis, IN',
        'Radial Development is an off-radar tech organization located in Indianapolis, IN.',
        'https://radialdevelopment.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@radialdevelopment.com',
        '10-25',
        'Indianapolis, IN',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_headway_io',
        'headway.io',
        'Headway',
        'Digital product innovation studio',
        'Digital product innovation studio',
        'https://headway.io',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@headway.io',
        '20-40',
        'Green Bay, WI',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_hologram_io',
        'hologram.io',
        'Hologram',
        'Global cellular platform for IoT devices',
        'Global cellular platform for IoT devices',
        'https://hologram.io',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@hologram.io',
        '50-100',
        'Chicago, IL',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_kin_com',
        'kin.com',
        'Kin Insurance',
        'Direct-to-consumer home insurance tech',
        'Direct-to-consumer home insurance tech',
        'https://kin.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@kin.com',
        '100-250',
        'Chicago, IL',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_joinroot_com',
        'joinroot.com',
        'Root Insurance',
        'Mobile-first telematics insurtech',
        'Mobile-first telematics insurtech',
        'https://joinroot.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@joinroot.com',
        '150-300',
        'Columbus, OH',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_showpad_com',
        'showpad.com',
        'Showpad',
        'Sales enablement tech platform',
        'Sales enablement tech platform',
        'https://showpad.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@showpad.com',
        '150-300',
        'Chicago, IL',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_upcity_com',
        'upcity.com',
        'UpCity',
        'B2B service provider marketplace',
        'B2B service provider marketplace',
        'https://upcity.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@upcity.com',
        '30-60',
        'Chicago, IL',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_braviantholdings_com',
        'braviantholdings.com',
        'Braviant Holdings',
        'Next-gen fintech lending analytics',
        'Next-gen fintech lending analytics',
        'https://braviantholdings.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@braviantholdings.com',
        '50-120',
        'Chicago, IL',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_leveltenenergy_com',
        'leveltenenergy.com',
        'LevelTen Energy',
        'Renewable energy marketplace software',
        'Renewable energy marketplace software',
        'https://leveltenenergy.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@leveltenenergy.com',
        '40-80',
        'Midwest / Remote',
        'midwest_boutique',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_modernize_com',
        'modernize.com',
        'Modernize Home Services',
        'Home improvement digital marketplace',
        'Home improvement digital marketplace',
        'https://modernize.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@modernize.com',
        '50-150',
        'Austin, TX',
        'texas_southwest',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_flosports_tv',
        'flosports.tv',
        'FloSports',
        'Direct-to-consumer sports streaming network',
        'Direct-to-consumer sports streaming network',
        'https://flosports.tv',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@flosports.tv',
        '150-300',
        'Austin, TX',
        'texas_southwest',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_liquibase_org',
        'liquibase.org',
        'Liquibase',
        'Open source database change management tooling',
        'Open source database change management tooling',
        'https://liquibase.org',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@liquibase.org',
        '40-80',
        'Austin, TX',
        'texas_southwest',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_junglescout_com',
        'junglescout.com',
        'Jungle Scout',
        'All-in-one platform for e-commerce sellers',
        'All-in-one platform for e-commerce sellers',
        'https://junglescout.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@junglescout.com',
        '100-200',
        'Austin, TX',
        'texas_southwest',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_aceable_com',
        'aceable.com',
        'Aceable',
        'Mobile education & certification platform',
        'Mobile education & certification platform',
        'https://aceable.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@aceable.com',
        '50-120',
        'Austin, TX',
        'texas_southwest',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_zenoss_com',
        'zenoss.com',
        'Zenoss',
        'Full-stack monitoring and AIOps software',
        'Full-stack monitoring and AIOps software',
        'https://zenoss.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@zenoss.com',
        '80-150',
        'Austin, TX',
        'texas_southwest',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_automox_com',
        'automox.com',
        'Automox',
        'Cloud-native cyber hygiene and patch automation',
        'Cloud-native cyber hygiene and patch automation',
        'https://automox.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@automox.com',
        '100-200',
        'Boulder, CO',
        'texas_southwest',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_jumpcloud_com',
        'jumpcloud.com',
        'JumpCloud',
        'Cloud directory and identity access platform',
        'Cloud directory and identity access platform',
        'https://jumpcloud.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@jumpcloud.com',
        '150-300',
        'Louisville, CO',
        'texas_southwest',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_sovrn_com',
        'sovrn.com',
        'Sovrn',
        'Publishing monetization tools and audience data',
        'Publishing monetization tools and audience data',
        'https://sovrn.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@sovrn.com',
        '100-200',
        'Boulder, CO',
        'texas_southwest',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_formstack_com',
        'formstack.com',
        'Formstack',
        'Workplace productivity and forms workflow SaaS',
        'Workplace productivity and forms workflow SaaS',
        'https://formstack.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@formstack.com',
        '100-250',
        'Colorado / Remote',
        'texas_southwest',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_guild_com',
        'guild.com',
        'Guild Education',
        'Workforce education and upskilling platform',
        'Workforce education and upskilling platform',
        'https://guild.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@guild.com',
        '200-400',
        'Denver, CO',
        'texas_southwest',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_route_com',
        'route.com',
        'Route',
        'Post-purchase package tracking and protection',
        'Post-purchase package tracking and protection',
        'https://route.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@route.com',
        '150-300',
        'Lehi, UT',
        'texas_southwest',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_podium_com',
        'podium.com',
        'Podium',
        'Customer communication platform for local businesses',
        'Customer communication platform for local businesses',
        'https://podium.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@podium.com',
        '200-450',
        'Lehi, UT',
        'texas_southwest',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_lucid_co',
        'lucid.co',
        'Lucid Software',
        'Makers of Lucidchart and Lucidspark collaboration',
        'Makers of Lucidchart and Lucidspark collaboration',
        'https://lucid.co',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@lucid.co',
        '250-500',
        'South Jordan, UT',
        'texas_southwest',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_canopytax_com',
        'canopytax.com',
        'Canopy',
        'Practice management software for tax professionals',
        'Practice management software for tax professionals',
        'https://canopytax.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@canopytax.com',
        '50-120',
        'Lehi, UT',
        'texas_southwest',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_pattern_com',
        'pattern.com',
        'Pattern',
        'Ecommerce acceleration platform and marketplace tech',
        'Ecommerce acceleration platform and marketplace tech',
        'https://pattern.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@pattern.com',
        '150-350',
        'Salt Lake City, UT',
        'texas_southwest',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_thoughtbot_com',
        'thoughtbot.com',
        'Thoughtbot',
        'Boutique design & development consultancy, creators of Paperclip & FactoryBot',
        'Boutique design & development consultancy, creators of Paperclip & FactoryBot',
        'https://thoughtbot.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@thoughtbot.com',
        '50-100',
        'Boston, MA',
        'east_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_viget_com',
        'viget.com',
        'Viget',
        'Digital product agency & craft development studio',
        'Digital product agency & craft development studio',
        'https://viget.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@viget.com',
        '40-80',
        'Falls Church, VA / Durham, NC',
        'east_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_alley_com',
        'alley.com',
        'Alley Interactive',
        'Engineering agency for media publishers & nonprofits',
        'Engineering agency for media publishers & nonprofits',
        'https://alley.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@alley.com',
        '50-100',
        'New York, NY',
        'east_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_dockyard_com',
        'dockyard.com',
        'DockYard',
        'Digital product studio specializing in Elixir, Ember, React',
        'Digital product studio specializing in Elixir, Ember, React',
        'https://dockyard.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@dockyard.com',
        '30-60',
        'Boston, MA',
        'east_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_carbonfive_com',
        'carbonfive.com',
        'Carbon Five',
        'Agile software development consultancy for growing teams',
        'Agile software development consultancy for growing teams',
        'https://carbonfive.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@carbonfive.com',
        '40-80',
        'New York, NY / SF',
        'east_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_postlight_com',
        'postlight.com',
        'Postlight',
        'Digital strategy, product, and platform engineering studio',
        'Digital strategy, product, and platform engineering studio',
        'https://postlight.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@postlight.com',
        '60-120',
        'New York, NY',
        'east_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_willowtreeapps_com',
        'willowtreeapps.com',
        'WillowTree',
        'Mobile and digital product engineering agency',
        'Mobile and digital product engineering agency',
        'https://willowtreeapps.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@willowtreeapps.com',
        '200-500',
        'Charlottesville, VA / Durham, NC',
        'east_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_formlabs_com',
        'formlabs.com',
        'Formlabs',
        '3D printing hardware & software systems',
        '3D printing hardware & software systems',
        'https://formlabs.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@formlabs.com',
        '200-500',
        'Somerville, MA',
        'east_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_datacamp_com',
        'datacamp.com',
        'DataCamp',
        'Interactive data science & AI learning platform',
        'Interactive data science & AI learning platform',
        'https://datacamp.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@datacamp.com',
        '150-300',
        'New York, NY',
        'east_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_policygenius_com',
        'policygenius.com',
        'Policygenius',
        'Online insurance marketplace and fintech software',
        'Online insurance marketplace and fintech software',
        'https://policygenius.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@policygenius.com',
        '150-350',
        'New York, NY',
        'east_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_betterment_com',
        'betterment.com',
        'Betterment',
        'Automated investing and financial advisory technology',
        'Automated investing and financial advisory technology',
        'https://betterment.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@betterment.com',
        '200-400',
        'New York, NY',
        'east_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_seatgeek_com',
        'seatgeek.com',
        'SeatGeek',
        'Mobile-focused ticket platform and stadium software',
        'Mobile-focused ticket platform and stadium software',
        'https://seatgeek.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@seatgeek.com',
        '200-450',
        'New York, NY',
        'east_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_pendo_io',
        'pendo.io',
        'Pendo',
        'Product experience, digital adoption, and user telemetry',
        'Product experience, digital adoption, and user telemetry',
        'https://pendo.io',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@pendo.io',
        '200-450',
        'Raleigh, NC',
        'east_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_bandwidth_com',
        'bandwidth.com',
        'Bandwidth',
        'Enterprise cloud communications and messaging APIs',
        'Enterprise cloud communications and messaging APIs',
        'https://bandwidth.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@bandwidth.com',
        '200-400',
        'Raleigh, NC',
        'east_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_spreedly_com',
        'spreedly.com',
        'Spreedly',
        'Universal payment orchestration gateway',
        'Universal payment orchestration gateway',
        'https://spreedly.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud","Ruby","Rails","Elixir"]',
        '{}',
        'jobs@spreedly.com',
        '50-120',
        'Durham, NC',
        'east_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_panic_com',
        'panic.com',
        'Panic',
        'Makers of Nova, Transmit, Prompt, and the Playdate handheld',
        'Makers of Nova, Transmit, Prompt, and the Playdate handheld',
        'https://panic.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@panic.com',
        '25-35',
        'Portland, OR',
        'west_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_metalab_com',
        'metalab.com',
        'MetaLab',
        'Boutique product studio that built early Slack, Uber, Pitch',
        'Boutique product studio that built early Slack, Uber, Pitch',
        'https://metalab.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@metalab.com',
        '80-150',
        'Seattle / Remote',
        'west_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_substantial_com',
        'substantial.com',
        'Substantial',
        'Digital product studio building custom software & AI apps',
        'Digital product studio building custom software & AI apps',
        'https://substantial.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@substantial.com',
        '20-50',
        'Seattle, WA',
        'west_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_outreach_io',
        'outreach.io',
        'Outreach',
        'Sales execution and intelligence software platform',
        'Sales execution and intelligence software platform',
        'https://outreach.io',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@outreach.io',
        '250-500',
        'Seattle, WA',
        'west_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_highspot_com',
        'highspot.com',
        'Highspot',
        'Sales enablement platform with AI guidance',
        'Sales enablement platform with AI guidance',
        'https://highspot.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@highspot.com',
        '250-500',
        'Seattle, WA',
        'west_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_duckduckgo_com',
        'duckduckgo.com',
        'DuckDuckGo',
        'Privacy products: search, browser, tracker blocking',
        'Privacy products: search, browser, tracker blocking',
        'https://duckduckgo.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud","Mobile","C#","Perl","JavaScript","DevOps","Swift","Kotlin"]',
        '{}',
        'jobs@duckduckgo.com',
        '100-200',
        'Remote US / Paoli, PA',
        'west_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_linear_app',
        'linear.app',
        'Linear',
        'High-craft issue tracker for high-performing engineering teams',
        'High-craft issue tracker for high-performing engineering teams',
        'https://linear.app',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud","JavaScript","React","Node.js","AWS","GraphQL","Redis"]',
        '{}',
        'jobs@linear.app',
        '30-60',
        'San Francisco, CA / Remote',
        'west_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_resend_com',
        'resend.com',
        'Resend',
        'Email API for developers, craft-focused small team',
        'Email API for developers, craft-focused small team',
        'https://resend.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@resend.com',
        '5-15',
        'San Francisco, CA / Remote',
        'west_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_mintlify_com',
        'mintlify.com',
        'Mintlify',
        'Modern developer documentation platform',
        'Modern developer documentation platform',
        'https://mintlify.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@mintlify.com',
        '10-25',
        'San Francisco, CA',
        'west_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_loops_so',
        'loops.so',
        'Loops',
        'Email marketing built specifically for modern SaaS',
        'Email marketing built specifically for modern SaaS',
        'https://loops.so',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@loops.so',
        '5-15',
        'San Francisco, CA',
        'west_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_dub_co',
        'dub.co',
        'Dub',
        'Open-source link management platform, lean team',
        'Open-source link management platform, lean team',
        'https://dub.co',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@dub.co',
        '3-10',
        'San Francisco, CA / Remote',
        'west_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_clerk_com',
        'clerk.com',
        'Clerk',
        'User authentication & management built for React/Next.js',
        'User authentication & management built for React/Next.js',
        'https://clerk.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@clerk.com',
        '25-50',
        'San Francisco, CA',
        'west_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_raycast_com',
        'raycast.com',
        'Raycast',
        'Blazingly fast extensible desktop launcher for developers',
        'Blazingly fast extensible desktop launcher for developers',
        'https://raycast.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@raycast.com',
        '15-35',
        'Remote US',
        'west_coast',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_modal_com',
        'modal.com',
        'Modal Labs',
        'Run generative AI, batch jobs, and GPU workloads',
        'Run generative AI, batch jobs, and GPU workloads',
        'https://modal.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@modal.com',
        '15-30',
        'New York / SF / Remote',
        'ai_ml',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_replicate_com',
        'replicate.com',
        'Replicate',
        'Run open-source machine learning models with a cloud API',
        'Run open-source machine learning models with a cloud API',
        'https://replicate.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@replicate.com',
        '25-50',
        'San Francisco, CA',
        'ai_ml',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_together_ai',
        'together.ai',
        'Together AI',
        'Decentralized cloud for AI model training and inference',
        'Decentralized cloud for AI model training and inference',
        'https://together.ai',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@together.ai',
        '40-90',
        'San Francisco, CA',
        'ai_ml',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_groq_com',
        'groq.com',
        'Groq',
        'Ultra fast LPU inference engine for real-time LLMs',
        'Ultra fast LPU inference engine for real-time LLMs',
        'https://groq.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@groq.com',
        '100-200',
        'Mountain View, CA',
        'ai_ml',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_cursor_com',
        'cursor.com',
        'Cursor / Anysphere',
        'AI-first code editor, boutique high-performance engineering',
        'AI-first code editor, boutique high-performance engineering',
        'https://cursor.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@cursor.com',
        '10-25',
        'San Francisco, CA',
        'ai_ml',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_braintrustdata_com',
        'braintrustdata.com',
        'Braintrust',
        'Enterprise evaluations & logging for LLM apps',
        'Enterprise evaluations & logging for LLM apps',
        'https://braintrustdata.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@braintrustdata.com',
        '10-25',
        'San Francisco, CA',
        'ai_ml',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_langfuse_com',
        'langfuse.com',
        'Langfuse',
        'Open source LLM observability',
        'Open source LLM observability',
        'https://langfuse.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@langfuse.com',
        '5-15',
        'Remote US',
        'ai_ml',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_fly_io',
        'fly.io',
        'Fly.io',
        'Public cloud for apps close to users, founded in Chicago',
        'Public cloud for apps close to users, founded in Chicago',
        'https://fly.io',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@fly.io',
        '30-60',
        'Chicago / SF / Remote',
        'systems_infra',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_railway_app',
        'railway.app',
        'Railway',
        'Instant infrastructure platform, lean engineering team',
        'Instant infrastructure platform, lean engineering team',
        'https://railway.app',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@railway.app',
        '15-30',
        'San Francisco, CA / Remote',
        'systems_infra',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_render_com',
        'render.com',
        'Render',
        'Unified cloud to build and run all your apps and websites',
        'Unified cloud to build and run all your apps and websites',
        'https://render.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@render.com',
        '40-80',
        'San Francisco, CA',
        'systems_infra',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_supabase_com',
        'supabase.com',
        'Supabase',
        'Open source Firebase alternative built on PostgreSQL',
        'Open source Firebase alternative built on PostgreSQL',
        'https://supabase.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud","JavaScript","Rust","Go"]',
        '{}',
        'jobs@supabase.com',
        '60-120',
        'Remote US',
        'systems_infra',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_neon_tech',
        'neon.tech',
        'Neon',
        'Serverless Postgres with branching',
        'Serverless Postgres with branching',
        'https://neon.tech',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@neon.tech',
        '40-80',
        'Remote US',
        'systems_infra',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_planetscale_com',
        'planetscale.com',
        'PlanetScale',
        'Serverless MySQL platform powered by Vitess',
        'Serverless MySQL platform powered by Vitess',
        'https://planetscale.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@planetscale.com',
        '50-100',
        'Mountain View, CA',
        'systems_infra',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_turso_tech',
        'turso.tech',
        'Turso / ChiselStrike',
        'SQLite for the Edge powered by libSQL',
        'SQLite for the Edge powered by libSQL',
        'https://turso.tech',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@turso.tech',
        '15-30',
        'Remote US',
        'systems_infra',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_depot_dev',
        'depot.dev',
        'Depot',
        'Fast remote container builds',
        'Fast remote container builds',
        'https://depot.dev',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@depot.dev',
        '5-15',
        'San Francisco, CA',
        'systems_infra',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_tailscale_com',
        'tailscale.com',
        'Tailscale',
        'Zero-config mesh VPN based on WireGuard',
        'Zero-config mesh VPN based on WireGuard',
        'https://tailscale.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud","Go","React"]',
        '{}',
        'jobs@tailscale.com',
        '80-150',
        'Toronto / Remote US',
        'systems_infra',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_transistor_fm',
        'transistor.fm',
        'Transistor',
        'Podcast hosting for independent creators, team of 4',
        'Podcast hosting for independent creators, team of 4',
        'https://transistor.fm',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@transistor.fm',
        '4',
        'Remote US',
        'micro_saas',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_fathom_analytics_com',
        'fathom-analytics.com',
        'Fathom Analytics',
        'Privacy-focused website analytics, team of 5',
        'Privacy-focused website analytics, team of 5',
        'https://fathom-analytics.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@fathom-analytics.com',
        '5',
        'Remote US',
        'micro_saas',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_cal_com',
        'cal.com',
        'Cal.com',
        'Open source scheduling infrastructure',
        'Open source scheduling infrastructure',
        'https://cal.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@cal.com',
        '15-30',
        'Remote US',
        'micro_saas',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_posthog_com',
        'posthog.com',
        'PostHog',
        'All-in-one product analytics suite',
        'All-in-one product analytics suite',
        'https://posthog.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@posthog.com',
        '40-80',
        'Remote US',
        'micro_saas',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_trigger_dev',
        'trigger.dev',
        'Trigger.dev',
        'Background jobs framework for TypeScript',
        'Background jobs framework for TypeScript',
        'https://trigger.dev',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@trigger.dev',
        '5-15',
        'Remote US',
        'micro_saas',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_inngest_com',
        'inngest.com',
        'Inngest',
        'Event-driven durable execution engine',
        'Event-driven durable execution engine',
        'https://inngest.com',
        NULL,
        'Software & Technology',
        '["TypeScript","Fullstack","Cloud"]',
        '{}',
        'jobs@inngest.com',
        '10-25',
        'Remote US',
        'micro_saas',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_10up_com',
        '10up.com',
        '10up',
        'Web consulting',
        'Established remote company operating in Web consulting.',
        'https://10up.com/',
        NULL,
        'Web consulting',
        '["WordPress","PHP","Node","Web","React","TypeScript"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_automattic_com',
        'automattic.com',
        'Automattic',
        'WordPress & more',
        'Established remote company operating in WordPress & more.',
        'https://automattic.com',
        NULL,
        'WordPress & more',
        '["PHP","Java","Web","Mobile","Node","JavaScript","Python","React","Kafka"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_awesomemotive_com',
        'awesomemotive.com',
        'AwesomeMotive',
        'WordPress & more',
        'Established remote company operating in WordPress & more.',
        'https://awesomemotive.com',
        NULL,
        'WordPress & more',
        '["WordPress","PHP","React","Vue","Node"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_bairesdev_com',
        'bairesdev.com',
        'BairesDev',
        'Nearshore outsourcing company',
        'Established remote company operating in Nearshore outsourcing company.',
        'https://www.bairesdev.com/',
        NULL,
        'Nearshore outsourcing company',
        '["React","Node.js","Python",".NET","Java","Ruby","PHP","Golang"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_bandcamp_com',
        'bandcamp.com',
        'Bandcamp',
        'Music publishing platform',
        'Established remote company operating in Music publishing platform.',
        'https://bandcamp.com',
        NULL,
        'Music publishing platform',
        '["Ruby","Web"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_bandlab_com',
        'bandlab.com',
        'BandLab',
        'Social music platform',
        'Established remote company operating in Social music platform.',
        'https://bandlab.com',
        NULL,
        'Social music platform',
        '["Serverless",".NET","Node.js","TypeScript","Swift","Kotlin"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_buffer_com',
        'buffer.com',
        'Buffer',
        'Social media tools',
        'Established remote company operating in Social media tools.',
        'https://buffer.com',
        NULL,
        'Social media tools',
        '["PHP","Node","Web","Mobile","JavaScript"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_bunny_net',
        'bunny.net',
        'Bunny.net',
        'CDN',
        'Established remote company operating in CDN.',
        'https://bunny.net/',
        NULL,
        'CDN',
        '[".NET"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_canonical_com',
        'canonical.com',
        'Canonical',
        'Ubuntu dev & support',
        'Established remote company operating in Ubuntu dev & support.',
        'http://www.canonical.com/',
        NULL,
        'Ubuntu dev & support',
        '["C","C++","Python","DevOps"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_chef_io',
        'chef.io',
        'Chef',
        'IT automation',
        'Established remote company operating in IT automation.',
        'https://www.chef.io/',
        NULL,
        'IT automation',
        '["Ruby","DevOps"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_chess_com',
        'chess.com',
        'chess.com',
        'Online chess',
        'Established remote company operating in Online chess.',
        'https://www.chess.com',
        NULL,
        'Online chess',
        '["Java","mobile"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_cloudbeds_com',
        'cloudbeds.com',
        'Cloudbeds',
        'Hospitality Software',
        'Established remote company operating in Hospitality Software.',
        'https://www.cloudbeds.com/',
        NULL,
        'Hospitality Software',
        '["Web","DevOps"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_cloudbees_com',
        'cloudbees.com',
        'Cloudbees',
        'CI/CD, Jenkins, Codeship',
        'Established remote company operating in CI/CD, Jenkins, Codeship.',
        'https://www.cloudbees.com/',
        NULL,
        'CI/CD, Jenkins, Codeship',
        '["Java","Web","Go","Vuejs","Rails"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_getfilecloud_com',
        'getfilecloud.com',
        'Codelathe',
        'Enterprise File Sharing, Sync and Backup',
        'Established remote company operating in Enterprise File Sharing, Sync and Backup.',
        'https://www.getfilecloud.com/',
        NULL,
        'Enterprise File Sharing, Sync and Backup',
        '["PHP","Web","Node","C++"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_consensys_net',
        'consensys.net',
        'ConsenSys',
        'Blockchain studio',
        'Established remote company operating in Blockchain studio.',
        'https://consensys.net/',
        NULL,
        'Blockchain studio',
        '["Many (see job page)"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_crossover_com',
        'crossover.com',
        'Crossover',
        'Full-time long-term projects',
        'Established remote company operating in Full-time long-term projects.',
        'https://www.crossover.com/',
        NULL,
        'Full-time long-term projects',
        '["Many (see job page)"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_datadoghq_com',
        'datadoghq.com',
        'DataDog',
        'Monitoring & analytics',
        'Established remote company operating in Monitoring & analytics.',
        'http://www.datadoghq.com',
        NULL,
        'Monitoring & analytics',
        '["Scala","Java","Python","Go"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_datarobot_com',
        'datarobot.com',
        'DataRobot',
        'Data science as a service',
        'Established remote company operating in Data science as a service.',
        'http://www.datarobot.com',
        NULL,
        'Data science as a service',
        '["Python","R","Web","data stuff"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_deel_com',
        'deel.com',
        'Deel',
        'Global compliance, payroll, HR, benefits and IT.',
        'Established remote company operating in Global compliance, payroll, HR, benefits and IT..',
        'https://deel.com',
        NULL,
        'Global compliance, payroll, HR, benefits and IT.',
        '["Javascript","Python","Go","C#","Data stack"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_doist_com',
        'doist.com',
        'Doist',
        'Productivity and team communication apps',
        'Established remote company operating in Productivity and team communication apps.',
        'https://doist.com',
        NULL,
        'Productivity and team communication apps',
        '["Web","Mobile","Python","JavaScript","React","Ruby","Rails","Redis","Django"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_dribbble_com',
        'dribbble.com',
        'Dribbble',
        'Where Designers get Inspired & Hired',
        'Established remote company operating in Where Designers get Inspired & Hired.',
        'https://dribbble.com',
        NULL,
        'Where Designers get Inspired & Hired',
        '["Ruby","Web","Mobile"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_elastic_co',
        'elastic.co',
        'Elastic',
        'Elasticsearch, Kibana, Logstash, Beats',
        'Established remote company operating in Elasticsearch, Kibana, Logstash, Beats.',
        'https://www.elastic.co/',
        NULL,
        'Elasticsearch, Kibana, Logstash, Beats',
        '["Java","DevOps","Web","JavaScript","Python","Golang","Ruby"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_endpointdev_com',
        'endpointdev.com',
        'End Point Dev',
        'Web apps, public health, GIS, VisionPort',
        'Established remote company operating in Web apps, public health, GIS, VisionPort.',
        'https://www.endpointdev.com/',
        NULL,
        'Web apps, public health, GIS, VisionPort',
        '["JavaScript","React","Java","Ruby","Python","PostgreSQL","DevOps"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_envato_com',
        'envato.com',
        'Envato',
        'Sites for creatives',
        'Established remote company operating in Sites for creatives.',
        'https://envato.com/',
        NULL,
        'Sites for creatives',
        '["Ruby","Web"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_eyeo_com',
        'eyeo.com',
        'Eyeo',
        'AdBlock Plus & More',
        'Established remote company operating in AdBlock Plus & More.',
        'https://eyeo.com',
        NULL,
        'AdBlock Plus & More',
        '["Many"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_fireflies_ai',
        'fireflies.ai',
        'Fireflies.ai',
        'Automatic meeting notes',
        'Established remote company operating in Automatic meeting notes.',
        'https://fireflies.ai',
        NULL,
        'Automatic meeting notes',
        '["Node","Web","Python"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_gatsbyjs_com',
        'gatsbyjs.com',
        'Gatsby',
        'Platform for managing JAMstack websites',
        'Established remote company operating in Platform for managing JAMstack websites.',
        'https://gatsbyjs.com/',
        NULL,
        'Platform for managing JAMstack websites',
        '["Web","Node","React","TypeScript"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_genuitec_com',
        'genuitec.com',
        'Genuitec',
        'Eclipse-based tools',
        'Established remote company operating in Eclipse-based tools.',
        'http://www.genuitec.com',
        NULL,
        'Eclipse-based tools',
        '["Java","Eclipse","Web","Mobile"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_ghost_org',
        'ghost.org',
        'Ghost',
        'Publishing platform',
        'Established remote company operating in Publishing platform.',
        'https://ghost.org/',
        NULL,
        'Publishing platform',
        '["Node","Web"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_about_gitlab_com',
        'about.gitlab.com',
        'GitLab',
        'GitLab',
        'Established remote company operating in GitLab.',
        'https://about.gitlab.com/',
        NULL,
        'GitLab',
        '["Git","Ruby","Web","Rails"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_gradle_com',
        'gradle.com',
        'Gradle',
        'Gradle Enterprise & build tool',
        'Established remote company operating in Gradle Enterprise & build tool.',
        'https://gradle.com/',
        NULL,
        'Gradle Enterprise & build tool',
        '["Many (see job page)"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_grafana_com',
        'grafana.com',
        'Grafana Labs',
        'Monitoring & analytics',
        'Established remote company operating in Monitoring & analytics.',
        'http://www.grafana.com',
        NULL,
        'Monitoring & analytics',
        '["Go","Java",".NET","NodeJS","Python","Ruby","Rust","and more","JavaScript","React"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_helpscout_com',
        'helpscout.com',
        'Help Scout',
        'Help desk software',
        'Established remote company operating in Help desk software.',
        'https://www.helpscout.com/',
        NULL,
        'Help desk software',
        '["Java","Web"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_hubstaff_com',
        'hubstaff.com',
        'Hubstaff',
        'Time Tracking Tool',
        'Established remote company operating in Time Tracking Tool.',
        'https://www.hubstaff.com/',
        NULL,
        'Time Tracking Tool',
        '["Swift","Ruby","Web","Mobile"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_igalia_com',
        'igalia.com',
        'Igalia',
        'Embedded development, browsers',
        'Established remote company operating in Embedded development, browsers.',
        'https://www.igalia.com',
        NULL,
        'Embedded development, browsers',
        '["C++"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_jacksonriver_com',
        'jacksonriver.com',
        'Jackson River',
        'Nonprofit IT consulting',
        'Established remote company operating in Nonprofit IT consulting.',
        'https://www.jacksonriver.com/',
        NULL,
        'Nonprofit IT consulting',
        '["PHP","Drupal","Web"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_jitbit_com',
        'jitbit.com',
        'Jitbit Software',
        'Help desk software',
        'Established remote company operating in Help desk software.',
        'https://www.jitbit.com/',
        NULL,
        'Help desk software',
        '["ASP.NET","C#","JavaScript"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_kentik_com',
        'kentik.com',
        'Kentik',
        'Network observability platform',
        'Established remote company operating in Network observability platform.',
        'https://www.kentik.com',
        NULL,
        'Network observability platform',
        '["C/C++","Go","JavaScript","Node.js","Web"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_kraken_com',
        'kraken.com',
        'Kraken',
        'Bitcoin & cryptocurrency exchange',
        'Established remote company operating in Bitcoin & cryptocurrency exchange.',
        'https://www.kraken.com',
        NULL,
        'Bitcoin & cryptocurrency exchange',
        '["Rust","C++","Go","Python","React","DevOps","Mobile"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_lullabot_com',
        'lullabot.com',
        'Lullabot',
        'Design & dev consulting',
        'Established remote company operating in Design & dev consulting.',
        'https://www.lullabot.com/',
        NULL,
        'Design & dev consulting',
        '["PHP","Drupal","Web"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_madewithlove_com',
        'madewithlove.com',
        'madewithlove',
        'Web & software development',
        'Established remote company operating in Web & software development.',
        'https://madewithlove.com/',
        NULL,
        'Web & software development',
        '["PHP","Laravel","React +Native","Javascript","Web"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_mailerlite_com',
        'mailerlite.com',
        'MailerLite',
        'Email marketing software',
        'Established remote company operating in Email marketing software.',
        'https://www.mailerlite.com/',
        NULL,
        'Email marketing software',
        '["Many"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_marsbased_com',
        'marsbased.com',
        'MarsBased',
        'Web & mobile dev consultancy',
        'Established remote company operating in Web & mobile dev consultancy.',
        'https://marsbased.com/',
        NULL,
        'Web & mobile dev consultancy',
        '["Ruby on Rails","Angular","Ionic","Javascript","Web"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_mobilejazz_com',
        'mobilejazz.com',
        'Mobile Jazz',
        'Software development',
        'Established remote company operating in Software development.',
        'https://www.mobilejazz.com/',
        NULL,
        'Software development',
        '["PHP","Web","Mobile","Design"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_mozilla_org',
        'mozilla.org',
        'Mozilla',
        'Firefox & more',
        'Established remote company operating in Firefox & more.',
        'https://www.mozilla.org/',
        NULL,
        'Firefox & more',
        '["C++","Web","Mobile"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_netlify_com',
        'netlify.com',
        'Netlify',
        'Web developer platform based on JAMstack',
        'Established remote company operating in Web developer platform based on JAMstack.',
        'https://www.netlify.com',
        NULL,
        'Web developer platform based on JAMstack',
        '["Javascript","Node.js","Web","JavaScript"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_olark_com',
        'olark.com',
        'Olark',
        'Live chat widgets',
        'Established remote company operating in Live chat widgets.',
        'https://www.olark.com',
        NULL,
        'Live chat widgets',
        '["Ruby","Web","JavaScript","Python","Go","Node.js","Rails","Redis"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_o8_agency',
        'o8.agency',
        'Original Eight',
        'Web consulting',
        'Established remote company operating in Web consulting.',
        'https://www.o8.agency/',
        NULL,
        'Web consulting',
        '["PHP","Drupal","Web"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_percona_com',
        'percona.com',
        'Percona',
        'Open Source Database Software & Services',
        'Established remote company operating in Open Source Database Software & Services.',
        'https://www.percona.com/',
        NULL,
        'Open Source Database Software & Services',
        '["DBA","DevOps","Kubernetes","C/C++","Go","JavaScript"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_platform_sh',
        'platform.sh',
        'Platform.sh',
        'Continuous deployment cloud hosting',
        'Established remote company operating in Continuous deployment cloud hosting.',
        'http://platform.sh/',
        NULL,
        'Continuous deployment cloud hosting',
        '["Many"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_pythian_com',
        'pythian.com',
        'Pythian',
        'Data & IT consulting',
        'Established remote company operating in Data & IT consulting.',
        'https://www.pythian.com/',
        NULL,
        'Data & IT consulting',
        '["DBA","DevOps"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_redhat_com',
        'redhat.com',
        'RedHat',
        'Red Hat Linux Distribution',
        'Established remote company operating in Red Hat Linux Distribution.',
        'https://www.redhat.com/',
        NULL,
        'Red Hat Linux Distribution',
        '["Many"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_redoxengine_com',
        'redoxengine.com',
        'Redox',
        'Healthcare API Platform',
        'Established remote company operating in Healthcare API Platform.',
        'https://www.redoxengine.com',
        NULL,
        'Healthcare API Platform',
        '["Node","React","API","Networking"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_remote_com',
        'remote.com',
        'Remote',
        'Global HR Platform',
        'Established remote company operating in Global HR Platform.',
        'https://remote.com',
        NULL,
        'Global HR Platform',
        '["Elixir","Postgres","JavaScript","React"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_saas_group',
        'saas.group',
        'SaasGroup',
        'Software as a Service Portfolio Company',
        'Established remote company operating in Software as a Service Portfolio Company.',
        'https://saas.group/',
        NULL,
        'Software as a Service Portfolio Company',
        '["Ruby","Python","SQL","Go","More"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_scylladb_com',
        'scylladb.com',
        'ScyllaDB',
        'Real-Time Big Data Database, DBaaS',
        'Established remote company operating in Real-Time Big Data Database, DBaaS.',
        'https://scylladb.com/',
        NULL,
        'Real-Time Big Data Database, DBaaS',
        '["C++","GoLang","Python","Linux","DevOps"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_getshogun_com',
        'getshogun.com',
        'Shogun',
        'Ecommerce products',
        'Established remote company operating in Ecommerce products.',
        'https://getshogun.com/',
        NULL,
        'Ecommerce products',
        '["Ruby on Rails","React","JavaScript","Go","Ruby","Rails"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_shopify_com',
        'shopify.com',
        'Shopify',
        'Ecommerce platform',
        'Established remote company operating in Ecommerce platform.',
        'https://www.shopify.com/',
        NULL,
        'Ecommerce platform',
        '["Ruby","Go","TypeScript","React","Mobile","DevOps"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_sonatype_com',
        'sonatype.com',
        'Sonatype',
        'Software chain automation',
        'Established remote company operating in Software chain automation.',
        'https://www.sonatype.com/',
        NULL,
        'Software chain automation',
        '["Java","Groovy","DevOps"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_about_sourcegraph_com',
        'about.sourcegraph.com',
        'Sourcegraph',
        'Code search as a service',
        'Established remote company operating in Code search as a service.',
        'https://about.sourcegraph.com/',
        NULL,
        'Code search as a service',
        '["Go","TypeScript","React","Web"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_spotify_com',
        'spotify.com',
        'Spotify',
        'Music streaming platform',
        'Established remote company operating in Music streaming platform.',
        'https://www.spotify.com/',
        NULL,
        'Music streaming platform',
        '["Mobile"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_squareup_com',
        'squareup.com',
        'Square',
        'Square, Cash App',
        'Established remote company operating in Square, Cash App.',
        'https://www.squareup.com/',
        NULL,
        'Square, Cash App',
        '["Many"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_superside_com',
        'superside.com',
        'Superside',
        'Creative Collaboration and Design as a Service',
        'Established remote company operating in Creative Collaboration and Design as a Service.',
        'https://www.superside.com/',
        NULL,
        'Creative Collaboration and Design as a Service',
        '["Kotlin","React","Web"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_timedoctor_com',
        'timedoctor.com',
        'Time Doctor',
        'Time Tracking Tool',
        'Established remote company operating in Time Tracking Tool.',
        'https://www.timedoctor.com/',
        NULL,
        'Time Tracking Tool',
        '["PHP","Node","Angular","Web","Mobile"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_toggl_com',
        'toggl.com',
        'Toggl',
        'Time Tracking Tool',
        'Established remote company operating in Time Tracking Tool.',
        'https://www.toggl.com/',
        NULL,
        'Time Tracking Tool',
        '["Go","Ruby","PostgreSQL","Mobile","Web","Docker"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_toptal_com',
        'toptal.com',
        'Toptal',
        'Tech freelancer marketplace',
        'Established remote company operating in Tech freelancer marketplace.',
        'https://www.toptal.com/',
        NULL,
        'Tech freelancer marketplace',
        '["Ruby","Rails","React","GraphQL","Web","Kubernetes","JavaScript","Go"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_turing_com',
        'turing.com',
        'Turing',
        'AI-powered Talent Acquisition Platform',
        'Established remote company operating in AI-powered Talent Acquisition Platform.',
        'https://www.turing.com/',
        NULL,
        'AI-powered Talent Acquisition Platform',
        '["Many"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_upwork_com',
        'upwork.com',
        'Upwork',
        'Freelancer marketplace',
        'Established remote company operating in Freelancer marketplace.',
        'https://www.upwork.com/',
        NULL,
        'Freelancer marketplace',
        '["Flutter","GraphQL","Web","Kubernetes"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_vercel_com',
        'vercel.com',
        'Vercel',
        'Web developer platform based on JAMstack',
        'Established remote company operating in Web developer platform based on JAMstack.',
        'https://www.vercel.com',
        NULL,
        'Web developer platform based on JAMstack',
        '["Javascript","Node.js","Web"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_wikimediafoundation_org',
        'wikimediafoundation.org',
        'Wikimedia',
        'Wikipedia',
        'Established remote company operating in Wikipedia.',
        'https://wikimediafoundation.org/',
        NULL,
        'Wikipedia',
        '["Web","PHP"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_x_team_com',
        'x-team.com',
        'X-team',
        'Remote full-time projects',
        'Established remote company operating in Remote full-time projects.',
        'https://x-team.com/',
        NULL,
        'Remote full-time projects',
        '["Mobile","Web"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_xapo_com',
        'xapo.com',
        'Xapo',
        'Financial Technology',
        'Established remote company operating in Financial Technology.',
        'https://xapo.com/',
        NULL,
        'Financial Technology',
        '["Mobile","Web","Python"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_xwp_co',
        'xwp.co',
        'XWP',
        'Remote full-time projects',
        'Established remote company operating in Remote full-time projects.',
        'https://xwp.co/',
        NULL,
        'Remote full-time projects',
        '["Web","WordPress"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_youneedabudget_com',
        'youneedabudget.com',
        'You Need A Budget',
        'Budgeting Application',
        'Established remote company operating in Budgeting Application.',
        'https://www.youneedabudget.com/',
        NULL,
        'Budgeting Application',
        '["Ruby","Mobile","Web"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_zapier_com',
        'zapier.com',
        'Zapier',
        'App connectors',
        'Established remote company operating in App connectors.',
        'https://zapier.com/',
        NULL,
        'App connectors',
        '["Python","Node","Web","JavaScript","React","Node.js","AWS","Kafka","Redis","Django"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_zyte_com',
        'zyte.com',
        'Zyte',
        'Scraping as a service',
        'Established remote company operating in Scraping as a service.',
        'https://zyte.com/',
        NULL,
        'Scraping as a service',
        '["Python","Web"]',
        '{}',
        NULL,
        '10-100',
        'Remote / Worldwide',
        'established_remote',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_permitflow_com',
        'permitflow.com',
        'PermitFlow (YC W22)',
        'Hiring on Hacker News: Staff, Fullstack & Frontend Software Engineers',
        'PermitFlow (YC W22) | Staff, Fullstack & Frontend Software Engineers | New York, NY | ONSITE | Full-time | https://permitflow.com PermitFlow’s mission is to streamline and simplify construction permitting in the $1.6 trillion United States construction market. Our software reduces time to permit, su',
        'https://permitflow.com',
        NULL,
        'Technology',
        '["AI"]',
        '{}',
        NULL,
        '1-25',
        'New York, NY',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_supero_dev',
        'supero.dev',
        'Supero',
        'Hiring on Hacker News: Cloud / Platform Engineer',
        'Supero | Cloud / Platform Engineer | REMOTE (SF Bay Area, CA, US · Bengaluru, KA, India) | Full-time | https://www.supero.dev/careers/cloud-platform-engineer/ We generate full-stack apps and deploy them — a generated app becomes a live URL, on our infrastructure or in the customer''s own AWS or GCP a',
        'https://www.supero.dev/careers/software-engineer-intern/',
        NULL,
        'Technology',
        '["AWS","GCP","Kubernetes"]',
        '{}',
        NULL,
        '1-25',
        'REMOTE (SF Bay Area, CA, US · Bengaluru, KA, India)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_jobs_ashbyhq_com',
        'jobs.ashbyhq.com',
        'Deeter Analytics',
        'Hiring on Hacker News: ML Engineer',
        'Deeter Analytics | ML Engineer | REMOTE (WORLDWIDE) | Full-time Small private investment firm trading its own capital. One junior ML engineer to work directly with our senior technical lead on an AI system for our own trading. No finance background needed — we hire on fundamentals and side projects ',
        'https://jobs.ashbyhq.com/deeter-analytics/2c12339b-d302-427c..',
        NULL,
        'Technology',
        '["AI"]',
        '{}',
        NULL,
        '1-25',
        'REMOTE (WORLDWIDE)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_livekit_io',
        'livekit.io',
        'LiveKit',
        'Hiring on Hacker News: http://livekit.io/',
        'LiveKit| http://livekit.io/ | VoiceAI | webRTC | Remote | Full Time LiveKit is building the infrastructure layer for the voice-driven era of computing. Our platform gives developers everything they need to build, test, deploy, scale, and observe agents in production. Hiring: >> Product Engineer | NA',
        'http://livekit.io/',
        NULL,
        'Technology',
        '["WebRTC"]',
        '{}',
        NULL,
        '1-25',
        'VoiceAI',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_endlessaccess_bamboohr_com',
        'endlessaccess.bamboohr.com',
        'Endless Access',
        'Hiring on Hacker News: Engineering Lead',
        'Endless Access | Engineering Lead | Hybrid NYC | full time | 150k-250k We''re a mission-oriented org focused on bridging the global digital divide. Key to our strategy is our community game-making program: guiding learners to move from playing games to creating them. We''re hiring a tech lead for our ',
        'https://endlessaccess.bamboohr.com',
        NULL,
        'Technology',
        '["Vue","Node.js","GraphQL"]',
        '{}',
        NULL,
        '1-25',
        'Hybrid NYC',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_careers_auroraer_com',
        'careers.auroraer.com',
        'Aurora Energy Research',
        'Hiring on Hacker News: Senior & Junior Software Engineers',
        'Aurora Energy Research | Senior & Junior Software Engineers | Hybrid in Oxford, UK | full-time | https://careers.auroraer.com/ We’re hiring multiple passionate software developers to help build innovative solutions that power the future of energy. We have roles for every experience level. Work along',
        'https://careers.auroraer.com/postings/91347816-7029-442f-9dbc-93684ded5324',
        NULL,
        'Technology',
        '[]',
        '{}',
        NULL,
        '1-25',
        'Hybrid in Oxford, UK',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_egmn_fa_us2_oraclecloud_com',
        'egmn.fa.us2.oraclecloud.com',
        'Harmonic',
        'Hiring on Hacker News: Technical Trainer',
        'Harmonic | Technical Trainer | REMOTE (USA, East Coast based) | Full-time | 85k-105k USD Key requirements: Up to 50% time can be mandatory travel for on-site in-person training sessions, very variable across the year. But no requirement to work in the office. Corollary to that - fluent or very good ',
        'https://egmn.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/job/260137',
        NULL,
        'Technology',
        '[]',
        '{}',
        NULL,
        '1-25',
        'REMOTE (USA, East Coast based)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_crossref_org',
        'crossref.org',
        'Crossref',
        'Hiring on Hacker News: Head of Infrastructure Services',
        'Crossref | Head of Infrastructure Services | REMOTE | Full-time | 120k USD or local equivalent I''m the Director of Technology at Crossref and I''m looking for a Head of Infrastructure Services to join my team. This role will lead the strategy and evolution of Crossref''s infrastructure ecosystem, own ',
        'https://www.crossref.org/jobs/2026-09-01-head-of-infrastruct..',
        NULL,
        'Technology',
        '["PostgreSQL","AWS","AI"]',
        '{}',
        NULL,
        '1-25',
        'REMOTE',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_lnkd_in',
        'lnkd.in',
        'Flow Traders',
        'Hiring on Hacker News: Research Engineer',
        'Flow Traders | Research Engineer | Hong Kong/ London (onsite) | Full Time | Visa | Relocation Flow Traders is a leading proprietary trading firm with an entrepreneurial and innovative Tech culture at the heart of its business. We are looking for Research Engineers in our Hong Kong office. Join us bu',
        'https://lnkd.in/dWhh_m28',
        NULL,
        'Technology',
        '["Python","PyTorch"]',
        '{}',
        NULL,
        '1-25',
        'Hong Kong/ London (onsite)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_vcluster_com',
        'vcluster.com',
        'vCluster Labs',
        'Hiring on Hacker News: Multiple Engineering Roles',
        'vCluster Labs | Multiple Engineering Roles | REMOTE (US, Canada, Europe) | Full-time | $140k-$220k USD | $140k-220k CAD | €80K – €145K + Equity vCluster Labs builds the software layer that turns hardware into a cloud. One platform to turn raw compute into every kind of cluster, for the teams buildin',
        'https://www.vcluster.com/careers?ashby_jid=516c8859-83be-453..',
        NULL,
        'Technology',
        '["Python","Go","Kubernetes","LLM","AI"]',
        '{}',
        NULL,
        '1-25',
        'REMOTE (US, Canada, Europe)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_springcraft_ai',
        'springcraft.ai',
        'Springcraft',
        'Hiring on Hacker News: Manufacturing Engineer',
        'Springcraft | Manufacturing Engineer | On-site in Palo Alto, CA | Full time | $120k–$190k + equity Springcraft is building the platform for physical AI. Today, building robots and intelligent machines means navigating fragmented tools, incompatible hardware, and closed ecosystems. It takes too long,',
        'https://www.springcraft.ai/careers/?role=manufacturing-engin..',
        NULL,
        'Technology',
        '["AI"]',
        '{}',
        NULL,
        '1-25',
        'On-site in Palo Alto, CA',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_akkio_com',
        'akkio.com',
        'Akkio',
        'Hiring on Hacker News: Senior Software Engineers — FDE, Full-Stack, Backend',
        'Akkio | Senior Software Engineers — FDE, Full-Stack, Backend | US (Fully Remote) | Full-time | $160k–$240k + equity | https://www.akkio.com/jobs Akkio builds the AI platform the world''s largest media agencies (Havas, Horizon Media, and others) use to run campaign workflows in production: audience bu',
        'https://akkio.com',
        NULL,
        'Technology',
        '["TypeScript","Python","Vue","Node.js","LLM","AI"]',
        '{}',
        NULL,
        '1-25',
        'US (Fully Remote)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_tandemhealth_ai',
        'tandemhealth.ai',
        'Tandem Health',
        'Hiring on Hacker News: Engineers, PMs, Designers',
        'Tandem Health | Engineers, PMs, Designers | On-site in Stockholm, Sweden | Full time At Tandem Health we''re building a clinician copilot to allow clinicians to focus on care rather than administration. We’re building, launching and iterating quickly, and are rolling out across some of the largest ca',
        'https://tandemhealth.ai',
        NULL,
        'Technology',
        '["AI"]',
        '{}',
        NULL,
        '1-25',
        'On-site in Stockholm, Sweden',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_apexdentalpartners_com',
        'apexdentalpartners.com',
        'Apex Dental Partners',
        'Hiring on Hacker News: Full-Stack Developer',
        'Apex Dental Partners | Full-Stack Developer | Dallas, TX | REMOTE (US) or HYBRID | Full-time | apexdp.com We''re a Dental Support Organization running 65 practices across eight states. Dentistry doesn''t sound like a technical job, but the platform behind it is: we''ve built our own operations system (',
        'https://apexdentalpartners.com',
        NULL,
        'Technology',
        '["Go","React","Rails","AWS","AI"]',
        '{}',
        NULL,
        '1-25',
        'Dallas, TX',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_natera_com',
        'natera.com',
        'Natera',
        'Hiring on Hacker News: L3 Software Engineer',
        'Natera | L3 Software Engineer | Full-Time | Remote, USA | 140 - 160k USD | Genomics Tech | https://natera.com Natera, the leader in cfDNA testing, is expanding the EHR (Electronic Health Records) engineering team with a Software Engineer (L3) role. The team consists of 9 engineers mostly on the seni',
        'https://natera.com',
        NULL,
        'Technology',
        '["TypeScript","React"]',
        '{}',
        NULL,
        '1-25',
        'Full-Time',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_join_com',
        'join.com',
        'AiMi',
        'Hiring on Hacker News: Full Stack AI Engineer',
        'AiMi | Full Stack AI Engineer | Remote(Everywhere) | Full-time AiMi builds agentic AI infrastructure for capital markets: autonomous agents that ingest venue and vendor notifications, assess impact across client infrastructure, and drive change management workflows in real time, replacing what used ',
        'https://join.com/companies/aimitechnology/16658631-agentic-ai-engineer',
        NULL,
        'Technology',
        '["TypeScript","React","Node.js","AWS","LLM","AI"]',
        '{}',
        'vishnu.swaroop@aimi.technology',
        '1-25',
        'Remote(Everywhere)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_careers_confidolegal_com',
        'careers.confidolegal.com',
        'Confido Legal',
        'Hiring on Hacker News: Sr. Engineer',
        'Confido Legal | Sr. Engineer | REMOTE (US only) | Full-time | $175k–$225k base Confido Legal builds payments infrastructure for the legal industry. We''re hiring a senior engineer to design, build, and maintain our software — leading architecture and product design, and translating business requireme',
        'https://careers.confidolegal.com',
        NULL,
        'Technology',
        '["TypeScript","React","Next.js","AWS","Docker","GraphQL"]',
        '{}',
        NULL,
        '1-25',
        'REMOTE (US only)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_go_trymira_com',
        'go.trymira.com',
        'MIRA',
        'Hiring on Hacker News: Firmware Engineer',
        'MIRA | Firmware Engineer | San Francisco, CA | ONSITE | Full-time MIRA builds lightweight AI glasses that act as a second brain: they remember conversations, answer questions in under a second, translate 60+ languages, and surface useful context through a private display. We recently sold out and sh',
        'https://go.trymira.com/pages/firmware-engineer/',
        NULL,
        'Technology',
        '["Rust","Go","AI"]',
        '{}',
        NULL,
        '1-25',
        'San Francisco, CA',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_colonist_com',
        'colonist.com',
        'Colonist',
        'Hiring on Hacker News: Product Engineer',
        'Colonist | Product Engineer| Full-time | Remote & async Colonist.io is a multiplayer board game platform. ~20 people, millions of monthly players, no middle management between you and the product. You''ll own features end-to-end and ship to a live player base within days. Right now we''re evolving the',
        'https://colonist.com',
        NULL,
        'Technology',
        '["AI"]',
        '{}',
        NULL,
        '1-25',
        'Full-time',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_traxtech_com',
        'traxtech.com',
        'Trax',
        'Hiring on Hacker News: https://www.traxtech.com/',
        'Trax | https://www.traxtech.com/ | Onsite Cebu PH, Remote Costa Rica, Remote US are possible | Full-time | Architect I work best as a team - with someone who can challenge my assumptions and bolster my weaknesses. I''m looking to increase the bandwidth of the architecture function at Trax, as I can''t',
        'https://www.traxtech.com/',
        NULL,
        'Technology',
        '["JavaScript","Vue","Node.js","AI"]',
        '{}',
        NULL,
        '1-25',
        'Onsite Cebu PH, Remote Costa Rica, Remote US are possible',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_umh_app',
        'umh.app',
        'Cologne, Germany',
        'Hiring on Hacker News: UMH',
        'Cologne, Germany | UMH | Product Engineer | Full-time | 55 - 85k EUR | ONSITE (part remote) Hi, Alex and Jeremy here from UMH. 8 years ago, Jeremy was absolutely frustrated with the status quo of data infrastructure in manufacturing. Companies paid millions per year for "shitty 90s software" and are',
        'https://www.umh.app/careers/product-engineer-f-m-d-55-85k-eu..',
        NULL,
        'Technology',
        '["Docker"]',
        '{}',
        NULL,
        '1-25',
        'Product Engineer',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_careers_victoriametrics_com',
        'careers.victoriametrics.com',
        'VictoriaMetrics',
        'Hiring on Hacker News: Remote',
        'VictoriaMetrics | Remote | EMEA, North America | Hiring VictoriaMetrics is an open-source monitoring and observability company. We build VictoriaMetrics, VictoriaLogs, and VictoriaTraces — high-performance, cost-efficient solutions for metrics, logs, and traces. Our products are used by companies in',
        'https://careers.victoriametrics.com',
        NULL,
        'Technology',
        '[]',
        '{}',
        NULL,
        '1-25',
        'EMEA, North America',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_careers_searchatlas_com',
        'careers.searchatlas.com',
        'Search Atlas',
        'Hiring on Hacker News: Product Engineer (Product Manager role, not a Full-stack role)',
        'Search Atlas | Product Engineer (Product Manager role, not a Full-stack role) | REMOTE (anywhere, EST hours) | Full-time contractor | $23-$34 USD/hour | https://careers.searchatlas.com/jobs/599248-product-engineer... We''re ~160 people, fully remote, building an AI marketing platform. Our main produc',
        'https://careers.searchatlas.com/jobs/599248-product-engineer..',
        NULL,
        'Technology',
        '["Python","React","LLM","AI","Django"]',
        '{}',
        'joao.pedro@searchatlas.com',
        '1-25',
        'REMOTE (anywhere, EST hours)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_frequenz_com',
        'frequenz.com',
        'Frequenz Energy-as-a-Service GmbH',
        'Hiring on Hacker News: Full-Time',
        'Frequenz Energy-as-a-Service GmbH | Full-Time | Berlin, Germany We are a vibrant technology company developing groundbreaking solutions that enable the rapid transition towards a world of decentralized energy. We’re helping companies to rapidly transition from being passive electricity consumers to ',
        'https://www.frequenz.com/',
        NULL,
        'Technology',
        '["Rust"]',
        '{}',
        NULL,
        '1-25',
        'Berlin, Germany',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_lovable_dev',
        'lovable.dev',
        'lovable',
        'Hiring on Hacker News: stockholm, london (in-person)',
        'lovable | stockholm, london (in-person) | full-stack, frontend, backend, infra design, and ai research we sponsor visas and have very generous relocation packages. lovable is building an agentic technical co-founder, we are the best way for non-technical people go from idea to a real software busine',
        'https://lovable.dev/blog',
        NULL,
        'Technology',
        '["Go","AI"]',
        '{}',
        NULL,
        '1-25',
        'full-stack, frontend, backend, infra design, and ai research',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_forms_gle',
        'forms.gle',
        'Prophet Town LLC',
        'Hiring on Hacker News: Various Software Engineering Roles',
        'Prophet Town LLC | Various Software Engineering Roles | US – Remote and Hybrid | English fluency required | Full-time | $140K-$264K annual total comp (multiple) We are a people-first, boutique tech agency creating on-demand teams and software solutions for long-standing clients. These clients trust ',
        'https://forms.gle/tZwq7j2Ldwcas1wb7',
        NULL,
        'Technology',
        '["TypeScript","JavaScript","Python","React","Ruby","Rails","LLM","AI"]',
        '{}',
        NULL,
        '1-25',
        'US – Remote and Hybrid',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_duetsnetwork_com',
        'duetsnetwork.com',
        'Duets Network',
        'Hiring on Hacker News: Founding Engineer',
        'Duets Network | Founding Engineer | REMOTE (US-Based Only) | Equity + discretionary cash | ~10–15 hrs/wk Duets Network is an AI-powered platform connecting startups and investors across the sports and entertainment industries. We are building a dynamic ecosystem that bridges founders, capital, and s',
        'https://duetsnetwork.com',
        NULL,
        'Technology',
        '["React","Node.js","PostgreSQL","AWS","AI"]',
        '{}',
        NULL,
        '1-25',
        'REMOTE (US-Based Only)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_useodin_com',
        'useodin.com',
        'Odin',
        'Hiring on Hacker News: Senior Design Engineer, Senior Platform Engineer — Edge Systems',
        'Odin | Senior Design Engineer, Senior Platform Engineer — Edge Systems | Remote (US) | Full-time Odin builds workforce visibility and compliance software for critical infrastructure. We’re deployed on 500+ active projects with 100K+ workers, securing more than $100B in construction value. Senior Des',
        'https://useodin.com',
        NULL,
        'Technology',
        '["TypeScript","React","Node.js","GCP","Kubernetes","GraphQL"]',
        '{}',
        NULL,
        '1-25',
        'Remote (US)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_tecuity_com',
        'tecuity.com',
        'Tecuity',
        'Hiring on Hacker News: Senior Software Engineer I',
        'Tecuity | Senior Software Engineer I | Hyde Park, UT (ONSITE preferred; will consider candidates who can commute in 1-2x/month) | Full-time | $90k-$135k Tecuity has spent 20+ years building software for Secretary of State offices — state government agencies handling business filings and public recor',
        'https://tecuity.com',
        NULL,
        'Technology',
        '["React","AI"]',
        '{}',
        'hr@tecuity.com',
        '1-25',
        'Hyde Park, UT (ONSITE preferred; will consider candidates who can commute in 1-2x/month)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_jobs_polymer_co',
        'jobs.polymer.co',
        'Foray Bioscience',
        'Hiring on Hacker News: Software Engineer, Data & ML',
        'Foray Bioscience | Software Engineer, Data & ML | On-Site (Cambridge, MA) | Full Time | $105,000–$130,000 + equity Company: Foray is a plant production company using plant cells, artificial intelligence, and advanced biomanufacturing to grow materials, molecules, and seeds directly from the cell up.',
        'https://jobs.polymer.co/foray-bioscience/41044?source=Hacker..',
        NULL,
        'Technology',
        '["Python","AI","Machine Learning"]',
        '{}',
        NULL,
        '1-25',
        'On-Site (Cambridge, MA)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_xairatherapeutics_com',
        'xairatherapeutics.com',
        'Xaira Therapeutics',
        'Hiring on Hacker News: Midlevel/Senior/Staff Engineers',
        'Xaira Therapeutics | Midlevel/Senior/Staff Engineers | Seattle or SF Xaira Therapeutics is developing biological foundation models (not LLMs) to hit undruggable targets and cure disease. We''ve put together an incredible cross-disciplinary team of pharma veterans who have brought drugs to market, dru',
        'https://xairatherapeutics.com',
        NULL,
        'Technology',
        '["AI"]',
        '{}',
        'justin.yan@xaira.com',
        '1-25',
        'Seattle or SF',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_sentilink_com',
        'sentilink.com',
        'SentiLink',
        'Hiring on Hacker News: https://www.sentilink.com/',
        'SentiLink | https://www.sentilink.com/ | Engineering & Data Science | REMOTE, HYBRID, and ONSITE (USA) | Full Time Primarily hiring in the U.S. for more senior level roles. We’re hiring across Engineering (Full-stack and Infra) and Data Science / ML roles. Hiring at Manager/Director level as well as',
        'https://www.sentilink.com/',
        NULL,
        'Technology',
        '["Python","Rust","Go","PostgreSQL","Kubernetes","PyTorch","Kafka","Redis"]',
        '{}',
        NULL,
        '1-25',
        'Engineering & Data Science',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_legile_com',
        'legile.com',
        'Legile',
        'Hiring on Hacker News: Senior Full-Stack AI Engineer (CTO track)',
        'Legile | Senior Full-Stack AI Engineer (CTO track) | Antwerp, Belgium | HYBRID | Full-time | Belgium-based only Legile builds OneView, a legal AI platform that legal teams use in production for contract review, risk and compliance. We recently joined the Anchr software group and are scaling from pro',
        'https://legile.com',
        NULL,
        'Technology',
        '["TypeScript","Python","React","PostgreSQL","AI","FastAPI"]',
        '{}',
        'jobs@legile.be',
        '1-25',
        'Antwerp, Belgium',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_coder_com',
        'coder.com',
        'Coder',
        'Hiring on Hacker News: https://coder.com/',
        'Coder | https://coder.com/ | Multiple roles | Multiple locations | Full-time Coder is an AI software development company leading the future of autonomous coding. We empower teams to build software faster, more securely, and at scale through the collaboration of AI coding agents and human developers.',
        'https://coder.com/',
        NULL,
        'Technology',
        '["AI"]',
        '{}',
        NULL,
        '1-25',
        'Multiple roles',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_vlm_run',
        'vlm.run',
        'VLM Run ( https://vlm.run )',
        'Hiring on Hacker News: 1x Founding Infrastructure Engineer',
        'VLM Run ( https://vlm.run ) | 1x Founding Infrastructure Engineer We’re building the inference platform for visual intelligence. We’re a deeply technical team of veteran AI / computer-vision engineers (20+ years combined, MIT/CMU PhDs) who’ve shipped production ML infrastructure across autonomous dr',
        'https://vlm.run',
        NULL,
        'Technology',
        '["Docker","AI"]',
        '{}',
        'hiring@vlm.run',
        '1-25',
        'US',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_enveritas_org',
        'enveritas.org',
        'Enveritas (YC S18, non-profit)',
        'Hiring on Hacker News: Backend Software Engineer',
        'Enveritas (YC S18, non-profit) | Backend Software Engineer | Remote (Global) | https://enveritas.org/jobs/ Enveritas is a 501(c)(3) nonprofit working on sustainability issues facing smallholder coffee farmers. We collect field data in 30+ countries and build systems for analyzing risks in coffee, co',
        'https://enveritas.org/jobs/backend-software-eng/#10d7adef8us',
        NULL,
        'Technology',
        '["Python","PostgreSQL","AWS","Docker"]',
        '{}',
        NULL,
        '1-25',
        'Remote (Global)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_klassif_ai',
        'klassif.ai',
        'Klassif.ai',
        'Hiring on Hacker News: ML/AI Engineer',
        'Klassif.ai | ML/AI Engineer | Hybrid (Leuven, Belgium; remote 3 days/week) We started off naively as just another intelligent document processing SaaS. Years of experience have shown us where the real pain points and value lies. Join my AI team and be horrified by how many critical business processe',
        'https://klassif.ai',
        NULL,
        'Technology',
        '["AI"]',
        '{}',
        NULL,
        '1-25',
        'Hybrid (Leuven, Belgium; remote 3 days/week)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_nyc_com',
        'nyc.com',
        'NYC',
        'Hiring on Hacker News: ONSITE (hybrid) Norm Ai, the agentic law company, has a client base with a combined $30 trillion in assets under management. Norm Ai pioneered Legal Engineering, the process that empowers lawyers to build and supervise domain-specific AI agents with Norm’s proprietary suite of no-code software tools. Norm Ai technology is deployed inside many of the largest and most consequential institutions in the world. Norm Ai is also the technology behind Norm Law, LLP, a separate but affiliated AI-native law firm built for the era of agentic AI. Norm Law’s attorneys advise leading institutions across private funds, private equity, venture capital, real estate, registered funds, and financial regulation, using the same legal intelligence platform that powers Norm Ai’s products.',
        'NYC | ONSITE (hybrid) Norm Ai, the agentic law company, has a client base with a combined $30 trillion in assets under management. Norm Ai pioneered Legal Engineering, the process that empowers lawyers to build and supervise domain-specific AI agents with Norm’s proprietary suite of no-code software',
        'https://nyc.com',
        NULL,
        'Technology',
        '["AI"]',
        '{}',
        NULL,
        '1-25',
        'US',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_oscilarcom_com',
        'oscilarcom.com',
        'Oscilar.com',
        'Hiring on Hacker News: Sr/Staff Software Engineers, Security Engineer, Data Scientist',
        'Oscilar.com | Sr/Staff Software Engineers, Security Engineer, Data Scientist | REMOTE (US/Canada/Brazil/Poland/UK/India) Full-time AI Risk Decisioning™ platform that helps organizations manage onboarding, fraud, credit, and compliance risks Open roles: - Sr./Staff Security Engineer (Brazil) - Sr./St',
        'https://oscilarcom.com',
        NULL,
        'Technology',
        '["AI"]',
        '{}',
        NULL,
        '1-25',
        'REMOTE (US/Canada/Brazil/Poland/UK/India)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_senzingentityresolutionsdk_com',
        'senzingentityresolutionsdk.com',
        'Senzing (entity resolution SDK)',
        'Hiring on Hacker News: Platform Engineer',
        'Senzing (entity resolution SDK) | Platform Engineer | Remote (USA) | Full-time Senzing builds enterprise entity-resolution SDK technology — an embeddable library that runs entirely inside customer infrastructure with zero data exfiltration. We''re hiring a platform engineer to own the AWS infrastruct',
        'https://senzingentityresolutionsdk.com',
        NULL,
        'Technology',
        '["Python","Rust","PostgreSQL","Cloudflare","AWS","Kubernetes"]',
        '{}',
        'enghiring@senzing.com',
        '1-25',
        'Remote (USA)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_mwianimalhealth_com',
        'mwianimalhealth.com',
        'MWI Animal Health',
        'Hiring on Hacker News: Remote (US only)',
        'MWI Animal Health | Remote (US only) | Senior SWE, Senior DevOps US animal-health distributor. We build .NET/Angular apps and hardware UIs that talk to our APIs. 1. Senior Software Engineer Full-stack C#/ASP.NET Core, Node/Angular; backend services and device integrations. 7+ years, strong .NET. Nic',
        'https://mwianimalhealth.com',
        NULL,
        'Technology',
        '["AWS","Docker","LLM"]',
        '{}',
        NULL,
        '1-25',
        'Senior SWE, Senior DevOps',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_matcha_fm',
        'matcha.fm',
        'Matcha.fm',
        'Hiring on Hacker News: FULLY REMOTE (US / Canada / Europe / UK / Brazil / LATAM)',
        'Matcha.fm | FULLY REMOTE (US / Canada / Europe / UK / Brazil / LATAM) | Full-time | https://matcha.fm Repeat founder building something new, hiring for these roles: Full-Stack / Frontend Engineer — https://matcha.fm/apply/fse Marketing / GTM / Growth — https://matcha.fm/apply/marketing Backend Engin',
        'https://matcha.fm',
        NULL,
        'Technology',
        '["AI"]',
        '{}',
        NULL,
        '1-25',
        'Full-time',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_cascadespace_com',
        'cascadespace.com',
        'Cascade Space',
        'Hiring on Hacker News: Senior Mechanical Engineer',
        'Cascade Space | Senior Mechanical Engineer | San Francisco, CA (ONSITE) | Full-time | $150k - $190k + equity Cascade Space is building ground-based infrastructure to support missions to the moon and beyond. Instead of single large dishes, we''re building arrays of dishes combined with a digital beamf',
        'https://cascadespace.com',
        NULL,
        'Technology',
        '[]',
        '{}',
        'careers@cascade.space',
        '1-25',
        'San Francisco, CA (ONSITE)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_republicservices_com',
        'republicservices.com',
        'Republic Services',
        'Hiring on Hacker News: Staff Engineer – Agentic AI',
        'Republic Services | Staff Engineer – Agentic AI | REMOTE (US) | Full-time | $175k is our salary midpoint + 20% target bonus Republic Services is the second largest environmental services companies in North America — ~40K employees, thousands of trucks, hundreds of facilities, and a mountain of opera',
        'https://republicservices.com',
        NULL,
        'Technology',
        '["AWS","LLM","AI"]',
        '{}',
        'jgardner@republicservices.com',
        '1-25',
        'REMOTE (US)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_onewaytechhubs_com',
        'onewaytechhubs.com',
        'One Way Tech Hubs',
        'Hiring on Hacker News: Software Engineers',
        'One Way Tech Hubs | Software Engineers | Remote (US) | Full-Time We’re hiring experienced software engineers for fully remote positions open to candidates based in the US. We’re looking for engineers with 3+ years of professional experience in areas including: • Full-Stack Engineering • Backend / Fr',
        'https://onewaytechhubs.com',
        NULL,
        'Technology',
        '["Python","AI","Machine Learning"]',
        '{}',
        'hassanonewaytech@gmail.com',
        '1-25',
        'Remote (US)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_checklyhq_com',
        'checklyhq.com',
        'Checkly',
        'Hiring on Hacker News: https://www.checklyhq.com',
        'Checkly | https://www.checklyhq.com | Product Manager, Sales Engineer, Senior Sales Engineer | REMOTE (Europe / US Eastern) | Full-time The best developers don''t wait for a customer to tell them something''s broken. They catch it first, in the pull request, in staging, or in the checkout flow at 3am,',
        'https://www.checklyhq.com',
        NULL,
        'Technology',
        '["AI"]',
        '{}',
        NULL,
        '1-25',
        'Product Manager, Sales Engineer, Senior Sales Engineer',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_priorlabs_com',
        'priorlabs.com',
        'Prior Labs',
        'Hiring on Hacker News: Berlin, Freiburg, NYC',
        'Prior Labs | Berlin, Freiburg, NYC | ONSITE | Full-time | ML Infra, Research Scientist/Engineer, Backend, Full Stack We build foundation models for tabular data. Deep learning transformed text and images but mostly skipped tables, which are still the data behind most clinical trials, financial model',
        'https://priorlabs.com',
        NULL,
        'Technology',
        '["TypeScript","Python","React","GCP","AI","FastAPI"]',
        '{}',
        NULL,
        '1-25',
        'ONSITE',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_neonpay_com',
        'neonpay.com',
        'Neon Commerce',
        'Hiring on Hacker News: https://neonpay.com',
        'Neon Commerce | https://neonpay.com | Senior Software Engineer | New York, NY (On-Site) | Full-time I run the engineering team at Neon, the commerce platform for mobile games. We''re working on making it easier for game developers to monetize their games. We''re going after the Apple/Google duopoly by',
        'https://neonpay.com',
        NULL,
        'Technology',
        '[]',
        '{}',
        NULL,
        '1-25',
        'Senior Software Engineer',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_betterstack_com',
        'betterstack.com',
        'Better Stack',
        'Hiring on Hacker News: https://betterstack.com/',
        'Better Stack | https://betterstack.com/ | /^Full-?stack Engineer$/i | Remote (North America & Europe) We are software builders at :heart: CEO is a software engineer, COO is a software engineer, and you guessed it, CTO is an engineer, too. We are engineers, making the tools we always wanted. If you l',
        'https://betterstack.com/',
        NULL,
        'Technology',
        '[]',
        '{}',
        NULL,
        '1-25',
        '/^Full-?stack Engineer$/i',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_strobepower_com',
        'strobepower.com',
        'Strobe Power',
        'Hiring on Hacker News: Site Reliability Engineer',
        'Strobe Power | Site Reliability Engineer | ONSITE (SF) | https://strobepower.com AI data centers are creating a massive new wave of electricity demand and putting even more strain on an aging grid. Strobe is building the power company that will meet that demand. Our software turns batteries and gene',
        'https://strobepower.com',
        NULL,
        'Technology',
        '["TypeScript","Python","Rust","AWS","GraphQL","AI"]',
        '{}',
        'keeley@strobepower.com',
        '1-25',
        'ONSITE (SF)',
        'hn_whoishiring',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_15five_com',
        '15five.com',
        '15Five',
        'Remote engineering studio (medium)',
        '15Five remote software development team.',
        'https://www.15five.com',
        NULL,
        'Software & Services',
        '["JavaScript","Python","React","AWS","Django"]',
        '{}',
        NULL,
        'medium',
        'americas-europe',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_ably_io',
        'ably.io',
        'Ably',
        'Remote engineering studio (tiny)',
        'The [Ably platform](https://www.ably.io/platform) is a second generation realtime platform, built from the ground up over more than three years to uniquely solve realtime problems of the future, at scale. Ably''s customers are using Ably for things like live chat, realtime location tracking, live doc',
        'https://www.ably.io/',
        NULL,
        'Software & Services',
        '["JavaScript","Golang","Ruby","AWS","Redis","Elixir"]',
        '{}',
        NULL,
        'tiny',
        'europe',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_aerolab_co',
        'aerolab.co',
        'Aerolab',
        'Remote engineering studio (small)',
        'We’re a team of quirky yet lovable UX Wizards and Tech Geniuses. We create websites and apps, provide digital branding services and a consulting service to help customers define their product, strategy and roadmap from a user perspective.',
        'https://aerolab.co/',
        NULL,
        'Software & Services',
        '["JavaScript","React","Node.js"]',
        '{}',
        NULL,
        'small',
        'americas',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_aerostratsoftware_com',
        'aerostratsoftware.com',
        'Aerostrat',
        'Remote engineering studio (small)',
        'Aerostrat was founded in 2015 by both software and airline industry veterans. Our mission is to provide powerful and innovative software that is loved by our customers. Our goal is to be a customer-obsessed, innovative, fast-paced, and transparent company willing to not only listen to our customers ',
        'https://aerostratsoftware.com/',
        NULL,
        'Software & Services',
        '["JavaScript"]',
        '{}',
        NULL,
        'small',
        'americas',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_ae_studio',
        'ae.studio',
        'AEStudio',
        'Remote engineering studio (small)',
        'Agency Enterprise Studio (AE Studio) - We''re a team of designers, engineers, and data scientists that work with founders and executives to build products, scale teams, and teach Agile, focused towards increasing human agency.',
        'https://ae.studio/',
        NULL,
        'Software & Services',
        '["TypeScript","JavaScript","React","Node.js","Ruby","PostgreSQL","Docker"]',
        '{}',
        NULL,
        'small',
        'americas',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_aha_io',
        'aha.io',
        'Aha!',
        'Remote engineering studio (small)',
        'Home
Aha! is the world''s',
        'https://www.aha.io',
        NULL,
        'Software & Services',
        '["JavaScript","React","Ruby","Rails"]',
        '{}',
        NULL,
        'small',
        'europe',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_airbyte_com',
        'airbyte.com',
        'Airbyte',
        'Remote engineering studio (small)',
        '[Airbyte](https://airbyte.com/about-us) builds the new open-source data integration platform.  

Check out our [company handbook](https://handbook.airbyte.com/) for information about us, our story, culture, strategy, roadmap, benefits and more!',
        'https://airbyte.com/',
        NULL,
        'Software & Services',
        '["TypeScript","JavaScript","Python","React","Docker","Kubernetes"]',
        '{}',
        NULL,
        'small',
        'europe',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_airgarage_com',
        'airgarage.com',
        'AirGarage',
        'Remote engineering studio (small)',
        '[AirGarage](https://www.airgarage.com/) is a full service parking operator. We handle all of the day-to-day logistics that go into making your parking lot or garage the most successful version of itself.

We operate hundreds of parking lots and garages across the United States and Canada on behalf o',
        'https://www.airgarage.com/',
        NULL,
        'Software & Services',
        '["JavaScript","Python","Go","React","Django"]',
        '{}',
        NULL,
        'small',
        'americas',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_close_com',
        'close.com',
        'Close',
        'Remote engineering studio (small)',
        'Sales/CRM tool with great calling and email integration',
        'https://close.com',
        NULL,
        'Software & Services',
        '["JavaScript","Python","React","AWS","Docker","Kubernetes"]',
        '{}',
        NULL,
        'small',
        'worldwide',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_helpscout_net',
        'helpscout.net',
        'Help Scout',
        'Remote engineering studio (medium)',
        'Help Scout is designed with your customers in mind. Provide email and live chat with a personal touch, and deliver help content right where your customers need it, all in one place, all for one low price.',
        'https://www.helpscout.net/',
        NULL,
        'Software & Services',
        '["JavaScript","Go","React"]',
        '{}',
        NULL,
        'medium',
        'worldwide',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_honeycomb_tv',
        'honeycomb.tv',
        'Honeycomb',
        'Remote engineering studio (small)',
        'Supercharged video advertising delivery. Faster delivery and better
collaboration for brands, broadcasters and everyone in between.',
        'https://honeycomb.tv/',
        NULL,
        'Software & Services',
        '["Go","Ruby","Rails","AWS","Redis"]',
        '{}',
        NULL,
        'small',
        'europe',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_careers_hotjar_com',
        'careers.hotjar.com',
        'Hotjar',
        'Remote engineering studio (medium)',
        'Hotjar is a powerful product that reveals the online behavior and voice of a website’s users. By combining both analysis and feedback tools, Hotjar gives the ‘big picture’ of how to improve a site''s user experience and performance / conversion rates. Our team work on the compelling challenges that c',
        'https://careers.hotjar.com/',
        NULL,
        'Software & Services',
        '["JavaScript","Python","Go","PostgreSQL","Redis"]',
        '{}',
        NULL,
        'medium',
        'americas-europe',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_mattermost_com',
        'mattermost.com',
        'Mattermost',
        'Remote engineering studio (medium)',
        'Mattermost remote engineering team.',
        'https://mattermost.com/careers/',
        NULL,
        'Software & Services',
        '["JavaScript","Python","Go"]',
        '{}',
        NULL,
        'medium',
        'worldwide',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_prisma_io',
        'prisma.io',
        'Prisma',
        'Remote engineering studio (small)',
        'Prisma unlocks a new level of developer experience when working with databases thanks to its intuitive data model, automated migrations, type-safety & auto-completion',
        'https://www.prisma.io/',
        NULL,
        'Software & Services',
        '["TypeScript","JavaScript","Rust","Go","Node.js"]',
        '{}',
        NULL,
        'small',
        'worldwide',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_sourcegraph_com',
        'sourcegraph.com',
        'Sourcegraph',
        'Remote engineering studio (medium)',
        'Sourcegraph remote engineering team.',
        'https://sourcegraph.com/jobs',
        NULL,
        'Software & Services',
        '["JavaScript","Rust","Go","AI"]',
        '{}',
        NULL,
        'medium',
        'worldwide',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_stripe_com',
        'stripe.com',
        'Stripe',
        'Remote engineering studio (medium)',
        'Stripe is the best way to accept payments online and in mobile apps. We handle billions of dollars every year for forward-thinking businesses around the world.',
        'https://stripe.com/',
        NULL,
        'Software & Services',
        '["JavaScript","Ruby","PostgreSQL","AWS","Redis"]',
        '{}',
        NULL,
        'medium',
        'europe',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_fastly_com',
        'fastly.com',
        'Fastly',
        'Remote engineering studio (large)',
        'Fastly provides real-time content delivery network services. 
Our powerful edge cloud platform empowers developers to run, secure, and 
deliver websites and applications — as close to the users as possible, 
to create unforgettable experiences at global scale.',
        'https://www.fastly.com/',
        NULL,
        'Software & Services',
        '["TypeScript","Web"]',
        '{}',
        NULL,
        'large',
        'worldwide',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_gitbook_com',
        'gitbook.com',
        'Gitbook',
        'Remote engineering studio (tiny)',
        'GitBook’s ambition is to modernise how we share and leverage knowledge for teams.

GitBook first started in mid-2014 as an open source project. The original idea was to create a desktop collaborative app allowing users to create, edit and share technical docs. 

Observing the large usage of docs suc',
        'https://www.gitbook.com/',
        NULL,
        'Software & Services',
        '["TypeScript","JavaScript","Go","GCP"]',
        '{}',
        NULL,
        'tiny',
        'other',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_hashicorp_com',
        'hashicorp.com',
        'HashiCorp',
        'Remote engineering studio (large)',
        'HashiCorp is focused on building software that can provision, secure, and run any application on any infrastructure.

[The Tao of HashiCorp](https://www.hashicorp.com/tao-of-hashicorp) is the foundation that guides HashiCorp''s vision, roadmap, and product design. As you evaluate joining the company,',
        'https://www.hashicorp.com/',
        NULL,
        'Software & Services',
        '["JavaScript","Go","Ruby"]',
        '{}',
        NULL,
        'large',
        'worldwide',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_heroku_com',
        'heroku.com',
        'Heroku',
        'Remote engineering studio (large)',
        'Heroku is a cloud platform for deploying and running modern apps through managed containers, has integrated data services, and a powerful ecosystem. The Heroku developer experience is an app-centric approach for software delivery, integrated with today’s most popular developer tools and workflows.',
        'https://www.heroku.com/',
        NULL,
        'Software & Services',
        '["JavaScript","Go","Ruby","Rails","AWS","Kubernetes","Kafka","Redis","Elixir"]',
        '{}',
        NULL,
        'large',
        'americas-europe',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_logdna_com',
        'logdna.com',
        'LogDNA',
        'Remote engineering studio (medium)',
        'LogDNA provides multi-cloud log management solutions.',
        'https://logdna.com',
        NULL,
        'Software & Services',
        '["TypeScript","Web"]',
        '{}',
        NULL,
        'medium',
        'other',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_pagerduty_com',
        'pagerduty.com',
        'PagerDuty',
        'Remote engineering studio (large)',
        'PagerDuty is the leading digital operations management platform for businesses. Our SaaS-based solution empowers over 8,000 small, mid-size and enterprise global customers such as Comcast, eHarmony, Slack and Lululemon with the insight to intelligently respond to critical disruptions for exceptional',
        'https://pagerduty.com',
        NULL,
        'Software & Services',
        '["JavaScript","Ruby","Rails","Kafka","Elixir"]',
        '{}',
        NULL,
        'large',
        'americas',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_replit_com',
        'replit.com',
        'Replit',
        'Remote engineering studio (medium)',
        'We make programming more accessible by building powerful yet approachable tools and platforms for developers, students, and educators. We want to blur the line between learning and making– a place where you can hang out, tinker with ideas, learn new concepts, and launch a business all in the same da',
        'https://replit.com',
        NULL,
        'Software & Services',
        '["TypeScript","JavaScript","Rust","Go","React","Next.js","Node.js","Docker","Kubernetes","GraphQL"]',
        '{}',
        NULL,
        'medium',
        'worldwide',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;

INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        'comp_travis_ci_org',
        'travis-ci.org',
        'Travis CI',
        'Remote engineering studio (small)',
        'Test and Deploy with Confidence
Easily sync your projects with Travis CI and you’ll be testing your code in minutes!',
        'https://travis-ci.org/',
        NULL,
        'Software & Services',
        '["JavaScript","Ruby","AWS"]',
        '{}',
        NULL,
        'small',
        'worldwide',
        'remoteintech',
        1788619264701,
        1788619264701
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = 1788619264701;



-- 2. Career Pages

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_37signals_com_auto',
        'comp_37signals_com',
        'https://37signals.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_basecamp_com_auto',
        'comp_basecamp_com',
        'https://basecamp.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_promptloop_com_auto',
        'comp_promptloop_com',
        'https://promptloop.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_sixfeetup_com_auto',
        'comp_sixfeetup_com',
        'https://sixfeetup.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_bendyworks_com_auto',
        'comp_bendyworks_com',
        'https://bendyworks.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_softwareforgood_com_auto',
        'comp_softwareforgood_com',
        'https://softwareforgood.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_gaslight_co_auto',
        'comp_gaslight_co',
        'https://gaslight.co/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_atomicobject_com_auto',
        'comp_atomicobject_com',
        'https://atomicobject.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_crema_us_auto',
        'comp_crema_us',
        'https://crema.us/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_tablexi_com_auto',
        'comp_tablexi_com',
        'https://tablexi.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_testdouble_com_auto',
        'comp_testdouble_com',
        'https://testdouble.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_nerdery_com_auto',
        'comp_nerdery_com',
        'https://nerdery.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_spinweb_com_auto',
        'comp_spinweb_com',
        'https://spinweb.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_infinitemachines_co_auto',
        'comp_infinitemachines_co',
        'https://infinitemachines.co/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_cloverleaf_me_auto',
        'comp_cloverleaf_me',
        'https://cloverleaf.me/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_radialdevelopment_com_auto',
        'comp_radialdevelopment_com',
        'https://radialdevelopment.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_headway_io_auto',
        'comp_headway_io',
        'https://headway.io/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_hologram_io_auto',
        'comp_hologram_io',
        'https://hologram.io/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_kin_com_auto',
        'comp_kin_com',
        'https://kin.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_joinroot_com_auto',
        'comp_joinroot_com',
        'https://joinroot.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_showpad_com_auto',
        'comp_showpad_com',
        'https://showpad.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_upcity_com_auto',
        'comp_upcity_com',
        'https://upcity.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_braviantholdings_com_auto',
        'comp_braviantholdings_com',
        'https://braviantholdings.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_leveltenenergy_com_auto',
        'comp_leveltenenergy_com',
        'https://leveltenenergy.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_modernize_com_auto',
        'comp_modernize_com',
        'https://modernize.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_flosports_tv_auto',
        'comp_flosports_tv',
        'https://flosports.tv/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_liquibase_org_auto',
        'comp_liquibase_org',
        'https://liquibase.org/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_junglescout_com_auto',
        'comp_junglescout_com',
        'https://junglescout.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_aceable_com_auto',
        'comp_aceable_com',
        'https://aceable.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_zenoss_com_auto',
        'comp_zenoss_com',
        'https://zenoss.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_automox_com_auto',
        'comp_automox_com',
        'https://automox.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_jumpcloud_com_auto',
        'comp_jumpcloud_com',
        'https://jumpcloud.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_sovrn_com_auto',
        'comp_sovrn_com',
        'https://sovrn.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_formstack_com_auto',
        'comp_formstack_com',
        'https://formstack.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_guild_com_auto',
        'comp_guild_com',
        'https://guild.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_route_com_auto',
        'comp_route_com',
        'https://route.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_podium_com_auto',
        'comp_podium_com',
        'https://podium.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_lucid_co_auto',
        'comp_lucid_co',
        'https://lucid.co/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_canopytax_com_auto',
        'comp_canopytax_com',
        'https://canopytax.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_pattern_com_auto',
        'comp_pattern_com',
        'https://pattern.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_thoughtbot_com_auto',
        'comp_thoughtbot_com',
        'https://thoughtbot.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_viget_com_auto',
        'comp_viget_com',
        'https://viget.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_alley_com_auto',
        'comp_alley_com',
        'https://alley.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_dockyard_com_auto',
        'comp_dockyard_com',
        'https://dockyard.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_carbonfive_com_auto',
        'comp_carbonfive_com',
        'https://carbonfive.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_postlight_com_auto',
        'comp_postlight_com',
        'https://postlight.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_willowtreeapps_com_auto',
        'comp_willowtreeapps_com',
        'https://willowtreeapps.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_formlabs_com_auto',
        'comp_formlabs_com',
        'https://formlabs.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_datacamp_com_auto',
        'comp_datacamp_com',
        'https://datacamp.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_policygenius_com_auto',
        'comp_policygenius_com',
        'https://policygenius.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_betterment_com_auto',
        'comp_betterment_com',
        'https://betterment.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_seatgeek_com_auto',
        'comp_seatgeek_com',
        'https://seatgeek.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_pendo_io_auto',
        'comp_pendo_io',
        'https://pendo.io/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_bandwidth_com_auto',
        'comp_bandwidth_com',
        'https://bandwidth.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_spreedly_com_auto',
        'comp_spreedly_com',
        'https://spreedly.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_panic_com_auto',
        'comp_panic_com',
        'https://panic.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_metalab_com_auto',
        'comp_metalab_com',
        'https://metalab.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_substantial_com_auto',
        'comp_substantial_com',
        'https://substantial.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_outreach_io_auto',
        'comp_outreach_io',
        'https://outreach.io/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_highspot_com_auto',
        'comp_highspot_com',
        'https://highspot.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_duckduckgo_com_auto',
        'comp_duckduckgo_com',
        'https://duckduckgo.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_linear_app_auto',
        'comp_linear_app',
        'https://linear.app/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_resend_com_auto',
        'comp_resend_com',
        'https://resend.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_mintlify_com_auto',
        'comp_mintlify_com',
        'https://mintlify.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_loops_so_auto',
        'comp_loops_so',
        'https://loops.so/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_dub_co_auto',
        'comp_dub_co',
        'https://dub.co/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_clerk_com_auto',
        'comp_clerk_com',
        'https://clerk.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_raycast_com_auto',
        'comp_raycast_com',
        'https://raycast.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_modal_com_auto',
        'comp_modal_com',
        'https://modal.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_replicate_com_auto',
        'comp_replicate_com',
        'https://replicate.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_together_ai_auto',
        'comp_together_ai',
        'https://together.ai/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_groq_com_auto',
        'comp_groq_com',
        'https://groq.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_cursor_com_auto',
        'comp_cursor_com',
        'https://cursor.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_braintrustdata_com_auto',
        'comp_braintrustdata_com',
        'https://braintrustdata.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_langfuse_com_auto',
        'comp_langfuse_com',
        'https://langfuse.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_fly_io_auto',
        'comp_fly_io',
        'https://fly.io/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_railway_app_auto',
        'comp_railway_app',
        'https://railway.app/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_render_com_auto',
        'comp_render_com',
        'https://render.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_supabase_com_auto',
        'comp_supabase_com',
        'https://supabase.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_neon_tech_auto',
        'comp_neon_tech',
        'https://neon.tech/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_planetscale_com_auto',
        'comp_planetscale_com',
        'https://planetscale.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_turso_tech_auto',
        'comp_turso_tech',
        'https://turso.tech/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_depot_dev_auto',
        'comp_depot_dev',
        'https://depot.dev/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_tailscale_com_auto',
        'comp_tailscale_com',
        'https://tailscale.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_transistor_fm_auto',
        'comp_transistor_fm',
        'https://transistor.fm/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_fathom_analytics_com_auto',
        'comp_fathom_analytics_com',
        'https://fathom-analytics.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_cal_com_auto',
        'comp_cal_com',
        'https://cal.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_posthog_com_auto',
        'comp_posthog_com',
        'https://posthog.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_trigger_dev_auto',
        'comp_trigger_dev',
        'https://trigger.dev/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_inngest_com_auto',
        'comp_inngest_com',
        'https://inngest.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_10up_com_auto',
        'comp_10up_com',
        'https://10up.com/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_automattic_com_auto',
        'comp_automattic_com',
        'https://automattic.com/work-with-us/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_awesomemotive_com_auto',
        'comp_awesomemotive_com',
        'https://awesomemotive.com/careers/#positions',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_bairesdev_com_auto',
        'comp_bairesdev_com',
        'https://jobs.bairesdev.com/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_bandcamp_com_auto',
        'comp_bandcamp_com',
        'https://bandcamp.com/jobs',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_bandlab_com_auto',
        'comp_bandlab_com',
        'https://bandlab.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_buffer_com_auto',
        'comp_buffer_com',
        'http://journey.buffer.com/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_bunny_net_auto',
        'comp_bunny_net',
        'https://bunnynet.teamtailor.com/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_canonical_com_auto',
        'comp_canonical_com',
        'http://www.canonical.com/careers/all-vacancies',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_chef_io_auto',
        'comp_chef_io',
        'https://www.chef.io/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_chess_com_auto',
        'comp_chess_com',
        'https://www.chess.com/jobs',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_cloudbeds_com_auto',
        'comp_cloudbeds_com',
        'https://www.cloudbeds.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_cloudbees_com_auto',
        'comp_cloudbees_com',
        'https://www.cloudbees.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_getfilecloud_com_auto',
        'comp_getfilecloud_com',
        'https://www.getfilecloud.com/jobs',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_consensys_net_auto',
        'comp_consensys_net',
        'https://consensys.net/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_crossover_com_auto',
        'comp_crossover_com',
        'https://app.crossover.com/x/marketplace/available-jobs',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_datadoghq_com_auto',
        'comp_datadoghq_com',
        'https://www.datadoghq.com/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_datarobot_com_auto',
        'comp_datarobot_com',
        'http://www.datarobot.com/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_deel_com_auto',
        'comp_deel_com',
        'https://www.deel.com/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_doist_com_auto',
        'comp_doist_com',
        'https://doist.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_dribbble_com_auto',
        'comp_dribbble_com',
        'https://dribbble.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_elastic_co_auto',
        'comp_elastic_co',
        'https://www.elastic.co/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_endpointdev_com_auto',
        'comp_endpointdev_com',
        'https://www.endpointdev.com/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_envato_com_auto',
        'comp_envato_com',
        'https://envato.com/about/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_eyeo_com_auto',
        'comp_eyeo_com',
        'https://eyeo.com/jobs/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_fireflies_ai_auto',
        'comp_fireflies_ai',
        'https://jobs.gem.com/fireflies',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_gatsbyjs_com_auto',
        'comp_gatsbyjs_com',
        'https://www.gatsbyjs.com/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_genuitec_com_auto',
        'comp_genuitec_com',
        'http://www.genuitec.com/company/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_ghost_org_auto',
        'comp_ghost_org',
        'https://ghost.org/about/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_about_gitlab_com_auto',
        'comp_about_gitlab_com',
        'https://about.gitlab.com/jobs/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_gradle_com_auto',
        'comp_gradle_com',
        'https://gradle.com/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_grafana_com_auto',
        'comp_grafana_com',
        'https://grafana.com/about/careers/open-positions/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_helpscout_com_auto',
        'comp_helpscout_com',
        'https://www.helpscout.com/company/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_hubstaff_com_auto',
        'comp_hubstaff_com',
        'https://hubstaff.com/jobs',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_igalia_com_auto',
        'comp_igalia_com',
        'https://www.igalia.com/jobs/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_jacksonriver_com_auto',
        'comp_jacksonriver_com',
        'https://www.jacksonriver.com/about/jobs',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_jitbit_com_auto',
        'comp_jitbit_com',
        'https://www.jitbit.com/company/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_kentik_com_auto',
        'comp_kentik_com',
        'https://kentik.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_kraken_com_auto',
        'comp_kraken_com',
        'https://www.kraken.com/en-us/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_lullabot_com_auto',
        'comp_lullabot_com',
        'https://www.lullabot.com/jobs',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_madewithlove_com_auto',
        'comp_madewithlove_com',
        'https://madewithlove.com/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_mailerlite_com_auto',
        'comp_mailerlite_com',
        'https://www.mailerlite.com/jobs',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_marsbased_com_auto',
        'comp_marsbased_com',
        'https://marsbased.com/jobs',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_mobilejazz_com_auto',
        'comp_mobilejazz_com',
        'https://mobilejazz.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_mozilla_org_auto',
        'comp_mozilla_org',
        'https://careers.mozilla.org/listings/?location=Remote',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_netlify_com_auto',
        'comp_netlify_com',
        'https://www.netlify.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_olark_com_auto',
        'comp_olark_com',
        'https://www.olark.com/jobs/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_o8_agency_auto',
        'comp_o8_agency',
        'https://www.o8.agency/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_percona_com_auto',
        'comp_percona_com',
        'https://www.percona.com/about-percona/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_platform_sh_auto',
        'comp_platform_sh',
        'https://platform.sh/company/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_pythian_com_auto',
        'comp_pythian_com',
        'https://www.pythian.com/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_redhat_com_auto',
        'comp_redhat_com',
        'https://www.redhat.com/en/jobs',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_redoxengine_com_auto',
        'comp_redoxengine_com',
        'https://www.redoxengine.com/company/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_remote_com_auto',
        'comp_remote_com',
        'https://remote.com/openings',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_saas_group_auto',
        'comp_saas_group',
        'https://saas.group/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_scylladb_com_auto',
        'comp_scylladb_com',
        'https://www.scylladb.com/company/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_getshogun_com_auto',
        'comp_getshogun_com',
        'https://getshogun.com/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_shopify_com_auto',
        'comp_shopify_com',
        'https://www.shopify.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_sonatype_com_auto',
        'comp_sonatype_com',
        'https://www.sonatype.com/careers-sonatype',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_about_sourcegraph_com_auto',
        'comp_about_sourcegraph_com',
        'https://boards.greenhouse.io/sourcegraph91',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_spotify_com_auto',
        'comp_spotify_com',
        'https://www.lifeatspotify.com',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_squareup_com_auto',
        'comp_squareup_com',
        'https://careers.squareup.com/us/en/jobs?location%5B%5D=Remote',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_superside_com_auto',
        'comp_superside_com',
        'https://careers.superside.com/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_timedoctor_com_auto',
        'comp_timedoctor_com',
        'https://www.timedoctor.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_toggl_com_auto',
        'comp_toggl_com',
        'https://jobs.toggl.com/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_toptal_com_auto',
        'comp_toptal_com',
        'https://www.toptal.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_turing_com_auto',
        'comp_turing_com',
        'https://www.turing.com/remote-developer-jobs',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_upwork_com_auto',
        'comp_upwork_com',
        'https://www.upwork.com/careers/contract-roles/explore',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_vercel_com_auto',
        'comp_vercel_com',
        'https://vercel.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_wikimediafoundation_org_auto',
        'comp_wikimediafoundation_org',
        'https://wikimediafoundation.org/wiki/Work_with_us',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_x_team_com_auto',
        'comp_x_team_com',
        'https://jobs.x-team.com/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_xapo_com_auto',
        'comp_xapo_com',
        'https://xapo.com/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_xwp_co_auto',
        'comp_xwp_co',
        'https://xwp.co/about/careers/#open-positions',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_youneedabudget_com_auto',
        'comp_youneedabudget_com',
        'https://www.youneedabudget.com/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_zapier_com_auto',
        'comp_zapier_com',
        'https://zapier.com/jobs/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_zyte_com_auto',
        'comp_zyte_com',
        'https://zyte.com/jobs/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_permitflow_com_auto',
        'comp_permitflow_com',
        'https://jobs.ashbyhq.com/permitflow?departmentId=d33195eb-89',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_supero_dev_auto',
        'comp_supero_dev',
        'https://www.supero.dev/careers/cloud-platform-engineer/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_jobs_ashbyhq_com_auto',
        'comp_jobs_ashbyhq_com',
        'https://jobs.ashbyhq.com/deeter-analytics/2c12339b-d302-427c-9a73-d825b4b942b0',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_livekit_io_auto',
        'comp_livekit_io',
        'https://jobs.ashbyhq.com/livekit/463e2769-bb85-4429-96a3-3a175eb228cd',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_endlessaccess_bamboohr_com_auto',
        'comp_endlessaccess_bamboohr_com',
        'https://endlessaccess.bamboohr.com/careers/33',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_careers_auroraer_com_auto',
        'comp_careers_auroraer_com',
        'https://careers.auroraer.com/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_egmn_fa_us2_oraclecloud_com_auto',
        'comp_egmn_fa_us2_oraclecloud_com',
        'https://egmn.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/job/260137/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_crossref_org_auto',
        'comp_crossref_org',
        'https://www.crossref.org/jobs/2026-09-01-head-of-infrastructure-services/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_lnkd_in_auto',
        'comp_lnkd_in',
        'https://flowtraders.com/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_vcluster_com_auto',
        'comp_vcluster_com',
        'https://www.vcluster.com/careers?ashby_jid=516c8859-83be-4535-8d2d-32a305a07e6d#jobs',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_springcraft_ai_auto',
        'comp_springcraft_ai',
        'https://www.springcraft.ai/careers/?role=manufacturing-engineer',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_akkio_com_auto',
        'comp_akkio_com',
        'https://www.akkio.com/jobs',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_tandemhealth_ai_auto',
        'comp_tandemhealth_ai',
        'https://tandemhealth.ai/about/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_apexdentalpartners_com_auto',
        'comp_apexdentalpartners_com',
        'https://apexdentalpartners.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_natera_com_auto',
        'comp_natera_com',
        'https://natera.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_join_com_auto',
        'comp_join_com',
        'https://join.com/companies/aimitechnology/16658631-agentic-ai-engineer/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_careers_confidolegal_com_auto',
        'comp_careers_confidolegal_com',
        'https://careers.confidolegal.com/careers/sr-engineer',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_go_trymira_com_auto',
        'comp_go_trymira_com',
        'https://go.trymira.com/pages/firmware-engineer/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_colonist_com_auto',
        'comp_colonist_com',
        'https://jobs.ashbyhq.com/colonist',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_traxtech_com_auto',
        'comp_traxtech_com',
        'https://www.traxtech.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_umh_app_auto',
        'comp_umh_app',
        'https://www.umh.app/careers/product-engineer-f-m-d-55-85k-eur-cologne',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_careers_victoriametrics_com_auto',
        'comp_careers_victoriametrics_com',
        'https://careers.victoriametrics.com/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_careers_searchatlas_com_auto',
        'comp_careers_searchatlas_com',
        'https://careers.searchatlas.com/jobs/599248-product-engineer-pm',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_frequenz_com_auto',
        'comp_frequenz_com',
        'https://www.frequenz.com/jobs/senior-rust-engineer',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_lovable_dev_auto',
        'comp_lovable_dev',
        'https://lovable.dev/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_forms_gle_auto',
        'comp_forms_gle',
        'https://forms.gle/tZwq7j2Ldwcas1wb7/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_duetsnetwork_com_auto',
        'comp_duetsnetwork_com',
        'https://duetsnetwork.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_useodin_com_auto',
        'comp_useodin_com',
        'https://useodin.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_tecuity_com_auto',
        'comp_tecuity_com',
        'https://tecuity.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_jobs_polymer_co_auto',
        'comp_jobs_polymer_co',
        'https://jobs.polymer.co/foray-bioscience/41044?source=Hacker%20News',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_xairatherapeutics_com_auto',
        'comp_xairatherapeutics_com',
        'https://xairatherapeutics.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_sentilink_com_auto',
        'comp_sentilink_com',
        'https://jobs.ashbyhq.com/sentilink?utm_source=hacker_news',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_legile_com_auto',
        'comp_legile_com',
        'https://legile.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_coder_com_auto',
        'comp_coder_com',
        'https://coder.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_vlm_run_auto',
        'comp_vlm_run',
        'https://vlm.run/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_enveritas_org_auto',
        'comp_enveritas_org',
        'https://enveritas.org/jobs/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_klassif_ai_auto',
        'comp_klassif_ai',
        'https://klassif.ai/careers/ai-ml-engineer',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_nyc_com_auto',
        'comp_nyc_com',
        'https://jobs.ashbyhq.com/norm-ai?utm_source=7ow8wN5o3g',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_oscilarcom_com_auto',
        'comp_oscilarcom_com',
        'https://jobs.ashbyhq.com/oscilar?utm_source=HackerNews',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_senzingentityresolutionsdk_com_auto',
        'comp_senzingentityresolutionsdk_com',
        'https://senzingentityresolutionsdk.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_mwianimalhealth_com_auto',
        'comp_mwianimalhealth_com',
        'https://mwianimalhealth.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_matcha_fm_auto',
        'comp_matcha_fm',
        'https://matcha.fm/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_cascadespace_com_auto',
        'comp_cascadespace_com',
        'https://www.cascadespace.com/careers/mech-e/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_republicservices_com_auto',
        'comp_republicservices_com',
        'https://republicservices.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_onewaytechhubs_com_auto',
        'comp_onewaytechhubs_com',
        'https://onewaytechhubs.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_checklyhq_com_auto',
        'comp_checklyhq_com',
        'https://jobs.ashbyhq.com/checkly?utm_source=hn',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_priorlabs_com_auto',
        'comp_priorlabs_com',
        'https://jobs.ashbyhq.com/prior-labs',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_neonpay_com_auto',
        'comp_neonpay_com',
        'https://jobs.ashbyhq.com/Neon/86131334-4a12-4e86-8b53-d816519da8f3',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_betterstack_com_auto',
        'comp_betterstack_com',
        'https://betterstack.com/careers/fullstack-engineer',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_strobepower_com_auto',
        'comp_strobepower_com',
        'https://strobepower.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_15five_com_auto',
        'comp_15five_com',
        'https://www.15five.com/about/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_ably_io_auto',
        'comp_ably_io',
        'http://jobs.ably.io',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_aerolab_co_auto',
        'comp_aerolab_co',
        'http://careers.aerolab.co/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_aerostratsoftware_com_auto',
        'comp_aerostratsoftware_com',
        'https://aerostratsoftware.com/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_ae_studio_auto',
        'comp_ae_studio',
        'https://ae.studio/join-us',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_aha_io_auto',
        'comp_aha_io',
        'https://www.aha.io/company/careers/current-openings',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_airbyte_com_auto',
        'comp_airbyte_com',
        'https://airbyte.com/company/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_airgarage_com_auto',
        'comp_airgarage_com',
        'https://www.airgarage.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_close_com_auto',
        'comp_close_com',
        'http://jobs.close.com',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_helpscout_net_auto',
        'comp_helpscout_net',
        'https://www.helpscout.com/company/careers/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_honeycomb_tv_auto',
        'comp_honeycomb_tv',
        'https://honeycomb.tv/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_careers_hotjar_com_auto',
        'comp_careers_hotjar_com',
        'https://careers.hotjar.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_mattermost_com_auto',
        'comp_mattermost_com',
        'https://mattermost.com/careers/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_prisma_io_auto',
        'comp_prisma_io',
        'https://www.prisma.io/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_sourcegraph_com_auto',
        'comp_sourcegraph_com',
        'https://sourcegraph.com/jobs/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_stripe_com_auto',
        'comp_stripe_com',
        'https://stripe.com/jobs',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_fastly_com_auto',
        'comp_fastly_com',
        'https://www.fastly.com/about/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_gitbook_com_auto',
        'comp_gitbook_com',
        'https://jobs.gitbook.com/',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_hashicorp_com_auto',
        'comp_hashicorp_com',
        'https://www.hashicorp.com/jobs',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_heroku_com_auto',
        'comp_heroku_com',
        'https://www.heroku.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_logdna_com_auto',
        'comp_logdna_com',
        'https://logdna.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_pagerduty_com_auto',
        'comp_pagerduty_com',
        'https://pagerduty.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_replit_com_auto',
        'comp_replit_com',
        'https://replit.com/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );

INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        'page_comp_travis_ci_org_auto',
        'comp_travis_ci_org',
        'https://travis-ci.org/careers',
        'custom',
        'active',
        NULL,
        1788619264701,
        1788619264701
      );



-- 3. Jobs

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_permitflow_com_4b7127775dfa',
          'comp_permitflow_com',
          cp.id,
          'Staff, Fullstack & Frontend Software Engineers',
          'Engineering',
          'full-time',
          'New York, NY',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["AI"]',
          'PermitFlow (YC W22) is hiring a Staff, Fullstack & Frontend Software Engineers (New York, NY).',
          NULL,
          'url',
          'https://jobs.ashbyhq.com/permitflow?departmentId=d33195eb-89',
          'open',
          '4b7127775dfae317c1471acf0456b344',
          1788619264701,
          1788619264701,
          'lead',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_permitflow_com' OR cp.url = 'https://jobs.ashbyhq.com/permitflow?departmentId=d33195eb-89'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_supero_dev_5b18dbcf7683',
          'comp_supero_dev',
          cp.id,
          'Cloud / Platform Engineer',
          'Engineering',
          'full-time',
          'REMOTE (SF Bay Area, CA, US · Bengaluru, KA, India)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["AWS","GCP","Kubernetes"]',
          'Supero is hiring a Cloud / Platform Engineer (REMOTE (SF Bay Area, CA, US · Bengaluru, KA, India)).',
          NULL,
          'url',
          'https://www.supero.dev/careers/cloud-platform-engineer/',
          'open',
          '5b18dbcf7683972a89a03c7d3e2a5927',
          1788619264701,
          1788619264701,
          'mid',
          'devops_cloud',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_supero_dev' OR cp.url = 'https://www.supero.dev/careers/cloud-platform-engineer/'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_jobs_ashbyhq_com_21d154a6e530',
          'comp_jobs_ashbyhq_com',
          cp.id,
          'ML Engineer',
          'Engineering',
          'full-time',
          'REMOTE (WORLDWIDE)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["AI"]',
          'Deeter Analytics is hiring a ML Engineer (REMOTE (WORLDWIDE)).',
          NULL,
          'url',
          'https://jobs.ashbyhq.com/deeter-analytics/2c12339b-d302-427c-9a73-d825b4b942b0',
          'open',
          '21d154a6e530e37a2ebd0f47f639805c',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_jobs_ashbyhq_com' OR cp.url = 'https://jobs.ashbyhq.com/deeter-analytics/2c12339b-d302-427c-9a73-d825b4b942b0'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_livekit_io_1c33f479ca53',
          'comp_livekit_io',
          cp.id,
          'http://livekit.io/',
          'Engineering',
          'full-time',
          'VoiceAI',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["WebRTC"]',
          'LiveKit is hiring a http://livekit.io/ (VoiceAI).',
          NULL,
          'url',
          'https://jobs.ashbyhq.com/livekit/463e2769-bb85-4429-96a3-3a175eb228cd',
          'open',
          '1c33f479ca53a599bfbaaac917f60e4e',
          1788619264701,
          1788619264701,
          'mid',
          'fullstack',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_livekit_io' OR cp.url = 'https://jobs.ashbyhq.com/livekit/463e2769-bb85-4429-96a3-3a175eb228cd'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_endlessaccess_bamboohr_com_8c3e00555daa',
          'comp_endlessaccess_bamboohr_com',
          cp.id,
          'Engineering Lead',
          'Engineering',
          'full-time',
          'Hybrid NYC',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["Vue","Node.js","GraphQL"]',
          'Endless Access is hiring a Engineering Lead (Hybrid NYC).',
          NULL,
          'url',
          'https://endlessaccess.bamboohr.com/careers/33',
          'open',
          '8c3e00555daa379363a6984b7990e368',
          1788619264701,
          1788619264701,
          'lead',
          'fullstack',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_endlessaccess_bamboohr_com' OR cp.url = 'https://endlessaccess.bamboohr.com/careers/33'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_careers_auroraer_com_a03aa7287db6',
          'comp_careers_auroraer_com',
          cp.id,
          'Senior & Junior Software Engineers',
          'Engineering',
          'full-time',
          'Hybrid in Oxford, UK',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '[]',
          'Aurora Energy Research is hiring a Senior & Junior Software Engineers (Hybrid in Oxford, UK).',
          NULL,
          'url',
          'https://careers.auroraer.com/',
          'open',
          'a03aa7287db634ec1e75b6a9b4603447',
          1788619264701,
          1788619264701,
          'junior',
          'fullstack',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_careers_auroraer_com' OR cp.url = 'https://careers.auroraer.com/'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_egmn_fa_us2_oraclecloud_com_fd26b135bb5e',
          'comp_egmn_fa_us2_oraclecloud_com',
          cp.id,
          'Technical Trainer',
          'Engineering',
          'full-time',
          'REMOTE (USA, East Coast based)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '[]',
          'Harmonic is hiring a Technical Trainer (REMOTE (USA, East Coast based)).',
          NULL,
          'url',
          'https://egmn.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/job/260137',
          'open',
          'fd26b135bb5e2b3598895ed3959a1504',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_egmn_fa_us2_oraclecloud_com' OR cp.url = 'https://egmn.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/job/260137/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_crossref_org_47d7a5fb5bf6',
          'comp_crossref_org',
          cp.id,
          'Head of Infrastructure Services',
          'Engineering',
          'full-time',
          'REMOTE',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["PostgreSQL","AWS","AI"]',
          'Crossref is hiring a Head of Infrastructure Services (REMOTE).',
          NULL,
          'url',
          'https://www.crossref.org/jobs/2026-09-01-head-of-infrastructure-services/',
          'open',
          '47d7a5fb5bf6dda32fa30dd2e510f304',
          1788619264701,
          1788619264701,
          'lead',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_crossref_org' OR cp.url = 'https://www.crossref.org/jobs/2026-09-01-head-of-infrastructure-services/'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_lnkd_in_988347855d9e',
          'comp_lnkd_in',
          cp.id,
          'Research Engineer',
          'Engineering',
          'full-time',
          'Hong Kong/ London (onsite)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["Python","PyTorch"]',
          'Flow Traders is hiring a Research Engineer (Hong Kong/ London (onsite)).',
          NULL,
          'url',
          'https://flowtraders.com/careers/',
          'open',
          '988347855d9e5b9d6624af47ebd8b282',
          1788619264701,
          1788619264701,
          'mid',
          'fullstack',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_lnkd_in' OR cp.url = 'https://flowtraders.com/careers/'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_vcluster_com_33201c9a009f',
          'comp_vcluster_com',
          cp.id,
          'Multiple Engineering Roles',
          'Engineering',
          'full-time',
          'REMOTE (US, Canada, Europe)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["Python","Go","Kubernetes","LLM","AI"]',
          'vCluster Labs is hiring a Multiple Engineering Roles (REMOTE (US, Canada, Europe)).',
          NULL,
          'url',
          'https://www.vcluster.com/careers?ashby_jid=516c8859-83be-4535-8d2d-32a305a07e6d#jobs',
          'open',
          '33201c9a009fda32fb36a66af259b989',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_vcluster_com' OR cp.url = 'https://www.vcluster.com/careers?ashby_jid=516c8859-83be-4535-8d2d-32a305a07e6d#jobs'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_springcraft_ai_5da1da87dda0',
          'comp_springcraft_ai',
          cp.id,
          'Manufacturing Engineer',
          'Engineering',
          'full-time',
          'On-site in Palo Alto, CA',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["AI"]',
          'Springcraft is hiring a Manufacturing Engineer (On-site in Palo Alto, CA).',
          NULL,
          'url',
          'https://www.springcraft.ai/careers/?role=manufacturing-engineer',
          'open',
          '5da1da87dda0bb476f9edbda2187f0e9',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_springcraft_ai' OR cp.url = 'https://www.springcraft.ai/careers/?role=manufacturing-engineer'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_akkio_com_77a5081835b6',
          'comp_akkio_com',
          cp.id,
          'Senior Software Engineers — FDE, Full-Stack, Backend',
          'Engineering',
          'full-time',
          'US (Fully Remote)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["TypeScript","Python","Vue","Node.js","LLM","AI"]',
          'Akkio is hiring a Senior Software Engineers — FDE, Full-Stack, Backend (US (Fully Remote)).',
          NULL,
          'url',
          'https://www.akkio.com/jobs',
          'open',
          '77a5081835b6aacb01c3f2217e379cfd',
          1788619264701,
          1788619264701,
          'senior',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_akkio_com' OR cp.url = 'https://www.akkio.com/jobs'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_tandemhealth_ai_8c4a3e4905ba',
          'comp_tandemhealth_ai',
          cp.id,
          'Engineers, PMs, Designers',
          'Engineering',
          'full-time',
          'On-site in Stockholm, Sweden',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["AI"]',
          'Tandem Health is hiring a Engineers, PMs, Designers (On-site in Stockholm, Sweden).',
          NULL,
          'url',
          'https://tandemhealth.ai/about/careers',
          'open',
          '8c4a3e4905ba38fb2c6e8e845ed9712c',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_tandemhealth_ai' OR cp.url = 'https://tandemhealth.ai/about/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_apexdentalpartners_com_7f4c7a5cc1be',
          'comp_apexdentalpartners_com',
          cp.id,
          'Full-Stack Developer',
          'Engineering',
          'full-time',
          'Dallas, TX',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["Go","React","Rails","AWS","AI"]',
          'Apex Dental Partners is hiring a Full-Stack Developer (Dallas, TX).',
          NULL,
          'url',
          'https://apexdentalpartners.com',
          'open',
          '7f4c7a5cc1be5535281872e3ff81b933',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_apexdentalpartners_com' OR cp.url = 'https://apexdentalpartners.com/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_natera_com_01758e9a4e94',
          'comp_natera_com',
          cp.id,
          'L3 Software Engineer',
          'Engineering',
          'full-time',
          'Full-Time',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["TypeScript","React"]',
          'Natera is hiring a L3 Software Engineer (Full-Time).',
          NULL,
          'url',
          'https://natera.com',
          'open',
          '01758e9a4e94faf3a1d1e6e374f23af8',
          1788619264701,
          1788619264701,
          'mid',
          'fullstack',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_natera_com' OR cp.url = 'https://natera.com/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_join_com_c76d61557ab2',
          'comp_join_com',
          cp.id,
          'Full Stack AI Engineer',
          'Engineering',
          'full-time',
          'Remote(Everywhere)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["TypeScript","React","Node.js","AWS","LLM","AI"]',
          'AiMi is hiring a Full Stack AI Engineer (Remote(Everywhere)).',
          NULL,
          'email',
          'vishnu.swaroop@aimi.technology',
          'open',
          'c76d61557ab2bc21f2e3ae343c72cf00',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_join_com' OR cp.url = 'https://join.com/companies/aimitechnology/16658631-agentic-ai-engineer/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_careers_confidolegal_com_3fbbcc1502e7',
          'comp_careers_confidolegal_com',
          cp.id,
          'Sr. Engineer',
          'Engineering',
          'full-time',
          'REMOTE (US only)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["TypeScript","React","Next.js","AWS","Docker","GraphQL"]',
          'Confido Legal is hiring a Sr. Engineer (REMOTE (US only)).',
          NULL,
          'url',
          'https://careers.confidolegal.com/careers/sr-engineer',
          'open',
          '3fbbcc1502e78c3220782dc9151656c7',
          1788619264701,
          1788619264701,
          'senior',
          'fullstack',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_careers_confidolegal_com' OR cp.url = 'https://careers.confidolegal.com/careers/sr-engineer'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_go_trymira_com_980c8935546a',
          'comp_go_trymira_com',
          cp.id,
          'Firmware Engineer',
          'Engineering',
          'full-time',
          'San Francisco, CA',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["Rust","Go","AI"]',
          'MIRA is hiring a Firmware Engineer (San Francisco, CA).',
          NULL,
          'url',
          'https://go.trymira.com/pages/firmware-engineer/',
          'open',
          '980c8935546a808adcce52a6799a5224',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_go_trymira_com' OR cp.url = 'https://go.trymira.com/pages/firmware-engineer/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_colonist_com_bc40b2f7e4d8',
          'comp_colonist_com',
          cp.id,
          'Product Engineer',
          'Engineering',
          'full-time',
          'Full-time',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["AI"]',
          'Colonist is hiring a Product Engineer (Full-time).',
          NULL,
          'url',
          'https://jobs.ashbyhq.com/colonist',
          'open',
          'bc40b2f7e4d8ce440a52494e28923e19',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_colonist_com' OR cp.url = 'https://jobs.ashbyhq.com/colonist'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_traxtech_com_27b3b37027d3',
          'comp_traxtech_com',
          cp.id,
          'https://www.traxtech.com/',
          'Engineering',
          'full-time',
          'Onsite Cebu PH, Remote Costa Rica, Remote US are possible',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["JavaScript","Vue","Node.js","AI"]',
          'Trax is hiring a https://www.traxtech.com/ (Onsite Cebu PH, Remote Costa Rica, Remote US are possible).',
          NULL,
          'url',
          'https://www.traxtech.com/',
          'open',
          '27b3b37027d3b628aa177a7cb8fe8ca4',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_traxtech_com' OR cp.url = 'https://www.traxtech.com/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_umh_app_6ee15b3aefcd',
          'comp_umh_app',
          cp.id,
          'UMH',
          'Engineering',
          'full-time',
          'Product Engineer',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["Docker"]',
          'Cologne, Germany is hiring a UMH (Product Engineer).',
          NULL,
          'url',
          'https://www.umh.app/careers/product-engineer-f-m-d-55-85k-eur-cologne',
          'open',
          '6ee15b3aefcd2ad7d547bd62cbefa7e2',
          1788619264701,
          1788619264701,
          'mid',
          'fullstack',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_umh_app' OR cp.url = 'https://www.umh.app/careers/product-engineer-f-m-d-55-85k-eur-cologne'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_careers_victoriametrics_com_a6e9faabc6c1',
          'comp_careers_victoriametrics_com',
          cp.id,
          'Remote',
          'Engineering',
          'full-time',
          'EMEA, North America',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '[]',
          'VictoriaMetrics is hiring a Remote (EMEA, North America).',
          NULL,
          'url',
          'https://careers.victoriametrics.com/',
          'open',
          'a6e9faabc6c1e9e90fa1a4a716edac97',
          1788619264701,
          1788619264701,
          'mid',
          'fullstack',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_careers_victoriametrics_com' OR cp.url = 'https://careers.victoriametrics.com/'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_careers_searchatlas_com_82b9aade8a5f',
          'comp_careers_searchatlas_com',
          cp.id,
          'Product Engineer (Product Manager role, not a Full-stack role)',
          'Engineering',
          'contract',
          'REMOTE (anywhere, EST hours)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["Python","React","LLM","AI","Django"]',
          'Search Atlas is hiring a Product Engineer (Product Manager role, not a Full-stack role) (REMOTE (anywhere, EST hours)).',
          NULL,
          'url',
          'https://careers.searchatlas.com/jobs/599248-product-engineer-pm',
          'open',
          '82b9aade8a5fc9a179f806048d40f8a7',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_careers_searchatlas_com' OR cp.url = 'https://careers.searchatlas.com/jobs/599248-product-engineer-pm'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_frequenz_com_552afd412a3b',
          'comp_frequenz_com',
          cp.id,
          'Full-Time',
          'Engineering',
          'full-time',
          'Berlin, Germany',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["Rust"]',
          'Frequenz Energy-as-a-Service GmbH is hiring a Full-Time (Berlin, Germany).',
          NULL,
          'url',
          'https://www.frequenz.com/jobs/senior-rust-engineer',
          'open',
          '552afd412a3b8f2c2f9985ca958ecf80',
          1788619264701,
          1788619264701,
          'mid',
          'fullstack',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_frequenz_com' OR cp.url = 'https://www.frequenz.com/jobs/senior-rust-engineer'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_lovable_dev_0d7591112c92',
          'comp_lovable_dev',
          cp.id,
          'stockholm, london (in-person)',
          'Engineering',
          'full-time',
          'full-stack, frontend, backend, infra design, and ai research',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["Go","AI"]',
          'lovable is hiring a stockholm, london (in-person) (full-stack, frontend, backend, infra design, and ai research).',
          NULL,
          'url',
          'https://lovable.dev/careers',
          'open',
          '0d7591112c9236d11cc19b6b8d51e515',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_lovable_dev' OR cp.url = 'https://lovable.dev/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_forms_gle_9bb834bd4775',
          'comp_forms_gle',
          cp.id,
          'Various Software Engineering Roles',
          'Engineering',
          'full-time',
          'US – Remote and Hybrid',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["TypeScript","JavaScript","Python","React","Ruby","Rails","LLM","AI"]',
          'Prophet Town LLC is hiring a Various Software Engineering Roles (US – Remote and Hybrid).',
          NULL,
          'url',
          'https://forms.gle/tZwq7j2Ldwcas1wb7',
          'open',
          '9bb834bd47755228259b93f9f7f6ebfa',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_forms_gle' OR cp.url = 'https://forms.gle/tZwq7j2Ldwcas1wb7/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_duetsnetwork_com_4be859a27805',
          'comp_duetsnetwork_com',
          cp.id,
          'Founding Engineer',
          'Engineering',
          'full-time',
          'REMOTE (US-Based Only)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["React","Node.js","PostgreSQL","AWS","AI"]',
          'Duets Network is hiring a Founding Engineer (REMOTE (US-Based Only)).',
          NULL,
          'url',
          'https://duetsnetwork.com',
          'open',
          '4be859a27805c54e490a0f9446afa32e',
          1788619264701,
          1788619264701,
          'founding',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_duetsnetwork_com' OR cp.url = 'https://duetsnetwork.com/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_useodin_com_39f205a7cf4a',
          'comp_useodin_com',
          cp.id,
          'Senior Design Engineer, Senior Platform Engineer — Edge Systems',
          'Engineering',
          'full-time',
          'Remote (US)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["TypeScript","React","Node.js","GCP","Kubernetes","GraphQL"]',
          'Odin is hiring a Senior Design Engineer, Senior Platform Engineer — Edge Systems (Remote (US)).',
          NULL,
          'url',
          'https://useodin.com',
          'open',
          '39f205a7cf4ad8cc00db969353d8262e',
          1788619264701,
          1788619264701,
          'senior',
          'devops_cloud',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_useodin_com' OR cp.url = 'https://useodin.com/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_tecuity_com_6719337b0639',
          'comp_tecuity_com',
          cp.id,
          'Senior Software Engineer I',
          'Engineering',
          'full-time',
          'Hyde Park, UT (ONSITE preferred; will consider candidates who can commute in 1-2x/month)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["React","AI"]',
          'Tecuity is hiring a Senior Software Engineer I (Hyde Park, UT (ONSITE preferred; will consider candidates who can commute in 1-2x/month)).',
          NULL,
          'email',
          'hr@tecuity.com',
          'open',
          '6719337b0639f57006d1d300fef51b3e',
          1788619264701,
          1788619264701,
          'senior',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_tecuity_com' OR cp.url = 'https://tecuity.com/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_jobs_polymer_co_7a9f526c7d9f',
          'comp_jobs_polymer_co',
          cp.id,
          'Software Engineer, Data & ML',
          'Engineering',
          'full-time',
          'On-Site (Cambridge, MA)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["Python","AI","Machine Learning"]',
          'Foray Bioscience is hiring a Software Engineer, Data & ML (On-Site (Cambridge, MA)).',
          NULL,
          'url',
          'https://jobs.polymer.co/foray-bioscience/41044?source=Hacker%20News',
          'open',
          '7a9f526c7d9fdf6e7b9d0241606a50fb',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_jobs_polymer_co' OR cp.url = 'https://jobs.polymer.co/foray-bioscience/41044?source=Hacker%20News'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_xairatherapeutics_com_50f9bffda51b',
          'comp_xairatherapeutics_com',
          cp.id,
          'Midlevel/Senior/Staff Engineers',
          'Engineering',
          'full-time',
          'Seattle or SF',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["AI"]',
          'Xaira Therapeutics is hiring a Midlevel/Senior/Staff Engineers (Seattle or SF).',
          NULL,
          'email',
          'justin.yan@xaira.com',
          'open',
          '50f9bffda51b0e819e849832e70cf63b',
          1788619264701,
          1788619264701,
          'lead',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_xairatherapeutics_com' OR cp.url = 'https://xairatherapeutics.com/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_sentilink_com_fdc0efdc6c01',
          'comp_sentilink_com',
          cp.id,
          'https://www.sentilink.com/',
          'Engineering',
          'full-time',
          'Engineering & Data Science',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["Python","Rust","Go","PostgreSQL","Kubernetes","PyTorch","Kafka","Redis"]',
          'SentiLink is hiring a https://www.sentilink.com/ (Engineering & Data Science).',
          NULL,
          'url',
          'https://jobs.ashbyhq.com/sentilink?utm_source=hacker_news',
          'open',
          'fdc0efdc6c0124601ca833dd3fba05ee',
          1788619264701,
          1788619264701,
          'mid',
          'fullstack',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_sentilink_com' OR cp.url = 'https://jobs.ashbyhq.com/sentilink?utm_source=hacker_news'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_legile_com_d3144bb1a41a',
          'comp_legile_com',
          cp.id,
          'Senior Full-Stack AI Engineer (CTO track)',
          'Engineering',
          'contract',
          'Antwerp, Belgium',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["TypeScript","Python","React","PostgreSQL","AI","FastAPI"]',
          'Legile is hiring a Senior Full-Stack AI Engineer (CTO track) (Antwerp, Belgium).',
          NULL,
          'email',
          'jobs@legile.be',
          'open',
          'd3144bb1a41a50857968c149fc41310d',
          1788619264701,
          1788619264701,
          'senior',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_legile_com' OR cp.url = 'https://legile.com/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_coder_com_0fcdfc470fb6',
          'comp_coder_com',
          cp.id,
          'https://coder.com/',
          'Engineering',
          'full-time',
          'Multiple roles',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["AI"]',
          'Coder is hiring a https://coder.com/ (Multiple roles).',
          NULL,
          'url',
          'https://coder.com/',
          'open',
          '0fcdfc470fb61457550aff7e1df9fc90',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_coder_com' OR cp.url = 'https://coder.com/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_vlm_run_8fc6d2d0d5fa',
          'comp_vlm_run',
          cp.id,
          '1x Founding Infrastructure Engineer',
          'Engineering',
          'full-time',
          'US',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["Docker","AI"]',
          'VLM Run ( https://vlm.run ) is hiring a 1x Founding Infrastructure Engineer (US).',
          NULL,
          'email',
          'hiring@vlm.run',
          'open',
          '8fc6d2d0d5fa91eb2fe23dacb355fb66',
          1788619264701,
          1788619264701,
          'founding',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_vlm_run' OR cp.url = 'https://vlm.run/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_enveritas_org_af48d755a0a7',
          'comp_enveritas_org',
          cp.id,
          'Backend Software Engineer',
          'Engineering',
          'full-time',
          'Remote (Global)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["Python","PostgreSQL","AWS","Docker"]',
          'Enveritas (YC S18, non-profit) is hiring a Backend Software Engineer (Remote (Global)).',
          NULL,
          'url',
          'https://enveritas.org/jobs/',
          'open',
          'af48d755a0a78a34719944e42af75860',
          1788619264701,
          1788619264701,
          'mid',
          'backend_systems',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_enveritas_org' OR cp.url = 'https://enveritas.org/jobs/'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_klassif_ai_2d1d6964614f',
          'comp_klassif_ai',
          cp.id,
          'ML/AI Engineer',
          'Engineering',
          'full-time',
          'Hybrid (Leuven, Belgium; remote 3 days/week)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["AI"]',
          'Klassif.ai is hiring a ML/AI Engineer (Hybrid (Leuven, Belgium; remote 3 days/week)).',
          NULL,
          'url',
          'https://klassif.ai/careers/ai-ml-engineer',
          'open',
          '2d1d6964614f79defb9eea5139bdc2a4',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_klassif_ai' OR cp.url = 'https://klassif.ai/careers/ai-ml-engineer'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_oscilarcom_com_fc5167228d42',
          'comp_oscilarcom_com',
          cp.id,
          'Sr/Staff Software Engineers, Security Engineer, Data Scientist',
          'Engineering',
          'full-time',
          'REMOTE (US/Canada/Brazil/Poland/UK/India)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["AI"]',
          'Oscilar.com is hiring a Sr/Staff Software Engineers, Security Engineer, Data Scientist (REMOTE (US/Canada/Brazil/Poland/UK/India)).',
          NULL,
          'url',
          'https://jobs.ashbyhq.com/oscilar?utm_source=HackerNews',
          'open',
          'fc5167228d423f57a3ac4741b05da04e',
          1788619264701,
          1788619264701,
          'lead',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_oscilarcom_com' OR cp.url = 'https://jobs.ashbyhq.com/oscilar?utm_source=HackerNews'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_senzingentityresolutionsdk_com_0d82fbd34f85',
          'comp_senzingentityresolutionsdk_com',
          cp.id,
          'Platform Engineer',
          'Engineering',
          'full-time',
          'Remote (USA)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["Python","Rust","PostgreSQL","Cloudflare","AWS","Kubernetes"]',
          'Senzing (entity resolution SDK) is hiring a Platform Engineer (Remote (USA)).',
          NULL,
          'email',
          'enghiring@senzing.com',
          'open',
          '0d82fbd34f8542b77cf19176a09b0e49',
          1788619264701,
          1788619264701,
          'mid',
          'devops_cloud',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_senzingentityresolutionsdk_com' OR cp.url = 'https://senzingentityresolutionsdk.com/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_mwianimalhealth_com_5cc2931298d5',
          'comp_mwianimalhealth_com',
          cp.id,
          'Remote (US only)',
          'Engineering',
          'full-time',
          'Senior SWE, Senior DevOps',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["AWS","Docker","LLM"]',
          'MWI Animal Health is hiring a Remote (US only) (Senior SWE, Senior DevOps).',
          NULL,
          'url',
          'https://mwianimalhealth.com',
          'open',
          '5cc2931298d5c2369c46d2ea84870732',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_mwianimalhealth_com' OR cp.url = 'https://mwianimalhealth.com/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_matcha_fm_b030fbea5db0',
          'comp_matcha_fm',
          cp.id,
          'FULLY REMOTE (US / Canada / Europe / UK / Brazil / LATAM)',
          'Engineering',
          'full-time',
          'Full-time',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["AI"]',
          'Matcha.fm is hiring a FULLY REMOTE (US / Canada / Europe / UK / Brazil / LATAM) (Full-time).',
          NULL,
          'url',
          'https://matcha.fm',
          'open',
          'b030fbea5db0bec81dc68ddac9fd6488',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_matcha_fm' OR cp.url = 'https://matcha.fm/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_cascadespace_com_ba0bb6fa2667',
          'comp_cascadespace_com',
          cp.id,
          'Senior Mechanical Engineer',
          'Engineering',
          'full-time',
          'San Francisco, CA (ONSITE)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '[]',
          'Cascade Space is hiring a Senior Mechanical Engineer (San Francisco, CA (ONSITE)).',
          NULL,
          'url',
          'https://www.cascadespace.com/careers/mech-e/',
          'open',
          'ba0bb6fa26676ba050055af17a9f6d91',
          1788619264701,
          1788619264701,
          'senior',
          'fullstack',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_cascadespace_com' OR cp.url = 'https://www.cascadespace.com/careers/mech-e/'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_republicservices_com_f001354685b8',
          'comp_republicservices_com',
          cp.id,
          'Staff Engineer – Agentic AI',
          'Engineering',
          'full-time',
          'REMOTE (US)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["AWS","LLM","AI"]',
          'Republic Services is hiring a Staff Engineer – Agentic AI (REMOTE (US)).',
          NULL,
          'email',
          'jgardner@republicservices.com',
          'open',
          'f001354685b89649669395dbd3d10080',
          1788619264701,
          1788619264701,
          'lead',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_republicservices_com' OR cp.url = 'https://republicservices.com/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_onewaytechhubs_com_32943c084af7',
          'comp_onewaytechhubs_com',
          cp.id,
          'Software Engineers',
          'Engineering',
          'full-time',
          'Remote (US)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["Python","AI","Machine Learning"]',
          'One Way Tech Hubs is hiring a Software Engineers (Remote (US)).',
          NULL,
          'email',
          'hassanonewaytech@gmail.com',
          'open',
          '32943c084af75641922bc4421e01bf09',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_onewaytechhubs_com' OR cp.url = 'https://onewaytechhubs.com/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_checklyhq_com_c419025e5f94',
          'comp_checklyhq_com',
          cp.id,
          'https://www.checklyhq.com',
          'Engineering',
          'full-time',
          'Product Manager, Sales Engineer, Senior Sales Engineer',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["AI"]',
          'Checkly is hiring a https://www.checklyhq.com (Product Manager, Sales Engineer, Senior Sales Engineer).',
          NULL,
          'url',
          'https://jobs.ashbyhq.com/checkly?utm_source=hn',
          'open',
          'c419025e5f94864d90dfc250bdc7284e',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_checklyhq_com' OR cp.url = 'https://jobs.ashbyhq.com/checkly?utm_source=hn'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_priorlabs_com_ee77aa63ad4a',
          'comp_priorlabs_com',
          cp.id,
          'Berlin, Freiburg, NYC',
          'Engineering',
          'full-time',
          'ONSITE',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["TypeScript","Python","React","GCP","AI","FastAPI"]',
          'Prior Labs is hiring a Berlin, Freiburg, NYC (ONSITE).',
          NULL,
          'url',
          'https://jobs.ashbyhq.com/prior-labs',
          'open',
          'ee77aa63ad4a2ecbaa6c2c9bece8e3d9',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_priorlabs_com' OR cp.url = 'https://jobs.ashbyhq.com/prior-labs'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_neonpay_com_e51b212b8dbb',
          'comp_neonpay_com',
          cp.id,
          'https://neonpay.com',
          'Engineering',
          'full-time',
          'Senior Software Engineer',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '[]',
          'Neon Commerce is hiring a https://neonpay.com (Senior Software Engineer).',
          NULL,
          'url',
          'https://jobs.ashbyhq.com/Neon/86131334-4a12-4e86-8b53-d816519da8f3',
          'open',
          'e51b212b8dbbae0ad52339cc4d2226ed',
          1788619264701,
          1788619264701,
          'mid',
          'fullstack',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_neonpay_com' OR cp.url = 'https://jobs.ashbyhq.com/Neon/86131334-4a12-4e86-8b53-d816519da8f3'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_betterstack_com_b97382ef36c7',
          'comp_betterstack_com',
          cp.id,
          'https://betterstack.com/',
          'Engineering',
          'full-time',
          '/^Full-?stack Engineer$/i',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '[]',
          'Better Stack is hiring a https://betterstack.com/ (/^Full-?stack Engineer$/i).',
          NULL,
          'url',
          'https://betterstack.com/careers/fullstack-engineer',
          'open',
          'b97382ef36c7ccd038948fe6053b83c9',
          1788619264701,
          1788619264701,
          'mid',
          'fullstack',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_betterstack_com' OR cp.url = 'https://betterstack.com/careers/fullstack-engineer'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';

INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          'job_comp_strobepower_com_1392b3f3412c',
          'comp_strobepower_com',
          cp.id,
          'Site Reliability Engineer',
          'Engineering',
          'full-time',
          'ONSITE (SF)',
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          '["TypeScript","Python","Rust","AWS","GraphQL","AI"]',
          'Strobe Power is hiring a Site Reliability Engineer (ONSITE (SF)).',
          NULL,
          'url',
          'https://strobepower.com/careers',
          'open',
          '1392b3f3412c601cfa312dd08caa2dd4',
          1788619264701,
          1788619264701,
          'mid',
          'ai_ml',
          1
        FROM career_pages cp
        WHERE cp.company_id = 'comp_strobepower_com' OR cp.url = 'https://strobepower.com/careers'
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = 1788619264701,
          status = 'open';



PRAGMA foreign_keys = ON;