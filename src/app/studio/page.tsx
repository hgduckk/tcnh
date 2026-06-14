'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '../../sanity.config' // Giảm bớt 1 cấp lùi folder
export default function StudioPage() {
  return <NextStudio config={config} />
}