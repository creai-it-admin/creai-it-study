import type {MetadataRoute} from 'next';
import {SITE_URL} from '@/lib/blog/content';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:['/routes/','/api/','/docs/']},sitemap:`${SITE_URL}/sitemap.xml`}}
