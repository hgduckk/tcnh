'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity.config' // Tăng lên 3 cấp lùi folder
export default function StudioPage() {
  return <NextStudio config={config} />
}